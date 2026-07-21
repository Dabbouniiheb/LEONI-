const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function createElement() {
  return {
    className: "",
    innerHTML: "",
    textContent: "",
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    addEventListener() {},
    getAttribute() { return null; },
    setAttribute() {},
  };
}

function loadLayout({ user = null, initials = () => "L" } = {}) {
  const elements = new Map();
  const document = {
    body: createElement(),
    createElement,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement());
      return elements.get(id);
    },
    querySelectorAll() { return []; },
  };
  const context = vm.createContext({
    document,
    LeoniAuth: {
      getUser: () => user,
      initials,
      logout() {},
      requiresPasswordChange: () => false,
      passwordChangeRequiredMessage: "Password change required",
    },
    requestAnimationFrame(callback) { callback(); },
    setTimeout,
  });
  vm.runInContext(
    `${read("views/assets/js/layout.js")}\nglobalThis.__layout = LeoniLayout;`,
    context
  );
  return { document, layout: context.__layout };
}

test("shared HTML escaping handles text and attribute metacharacters", () => {
  const { layout } = loadLayout();
  assert.equal(
    layout.escapeHtml(`<script data-x="a">Tom & Jerry's</script>`),
    "&lt;script data-x=&quot;a&quot;&gt;Tom &amp; Jerry&#39;s&lt;/script&gt;"
  );
});

test("layout escapes session-derived shell content and page headings", () => {
  const user = {
    name: `<img src=x onerror="alert(1)">`,
    role: `<script>alert(2)</script>`,
  };
  const { document, layout } = loadLayout({ user, initials: () => "<I>" });

  layout.mount({
    pageId: "dashboard",
    title: `<img src=x onerror="alert(3)">`,
    subtitle: `<script>alert(4)</script>`,
    contentHtml: "<section>Trusted page template</section>",
  });

  assert.doesNotMatch(document.body.innerHTML, /<img src=x|<script>alert|<I>/);
  assert.match(document.body.innerHTML, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(document.body.innerHTML, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
  assert.match(document.body.innerHTML, /&lt;I&gt;/);
});

test("dashboard uses the server window and escapes employee table values", async () => {
  const { layout } = loadLayout();
  const elements = new Map();
  const targetLabels = [createElement(), createElement(), createElement()];
  let injectedHtml = "";
  let statsMonth = null;

  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement());
      const element = elements.get(id);
      if (id === "dashboardMainCol") {
        element.insertAdjacentHTML = (_position, html) => { injectedHtml = html; };
      }
      return element;
    },
    querySelectorAll(selector) {
      return selector === "[data-dashboard-target-month]" ? targetLabels : [];
    },
  };
  const context = vm.createContext({
    document,
    LeoniAuth: {
      ensureAccess: async () => true,
      getUser: () => ({ id: 1, role: "Team Leader" }),
    },
    LeoniAPI: {
      getPlanningGenerationWindow: async () => ({
        window: {
          current_month: "2026-07",
          allowed_month: "2026-08",
          is_open: true,
        },
      }),
      getStats: async (filters) => {
        statsMonth = filters.month;
        return {
          totalUsers: 2,
          validationRate: 0,
          groupA: 0,
          groupB: 0,
          planningCompleted: 0,
        };
      },
      getUsers: async () => [{
        id: 2,
        role: "Data Cleansing",
        matricule: `M"><img src=x onerror="alert(1)">`,
        name: `<script>alert(2)</script>`,
        department: `Ops & "QA"`,
      }],
      getPlanning: async () => [],
      getMonthlyGroupSelectionStatus: async () => ({ selections: [] }),
    },
    LeoniLayout: {
      escapeHtml: layout.escapeHtml,
      formatGroup: layout.formatGroup,
      groupBadgeClass: layout.groupBadgeClass,
      mount() {},
      showLoading() {},
    },
    console: { error() {} },
  });

  await vm.runInContext(read("views/assets/js/dashboard.js"), context);

  assert.equal(statsMonth, "2026-08");
  assert.ok(targetLabels.every((label) => label.textContent === "2026-08"));
  assert.doesNotMatch(injectedHtml, /<img src=x|<script>alert/);
  assert.match(injectedHtml, /M&quot;&gt;&lt;img/);
  assert.match(injectedHtml, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
  assert.match(injectedHtml, /Ops &amp; &quot;QA&quot;/);
});

test("browser pages use the shared escaper without duplicate implementations", () => {
  for (const file of ["dashboard.js", "logs.js", "planning.js"]) {
    const source = read(path.join("views", "assets", "js", file));
    assert.doesNotMatch(source, /function\s+escapeHtml\s*\(/, file);
    assert.match(source, /LeoniLayout\.escapeHtml/, file);
  }
});

test("ensureAccess performs exactly one session request", async () => {
  let sessionRequests = 0;
  const context = vm.createContext({
    LeoniAPI: {
      async getSession() {
        sessionRequests += 1;
        return { user: { id: 1, role: "Team Leader" } };
      },
    },
    window: { location: { href: "" } },
  });
  vm.runInContext(
    `${read("views/assets/js/auth.js")}\nglobalThis.__auth = LeoniAuth;`,
    context
  );

  assert.equal(await context.__auth.ensureAccess(), true);
  assert.equal(sessionRequests, 1);
});

test("protected page initialization does not repeat the session refresh", () => {
  const protectedPages = [
    "calendar.js",
    "dashboard.js",
    "export.js",
    "leave-requests.js",
    "logs.js",
    "planning.js",
    "users.js",
  ];

  for (const file of protectedPages) {
    const source = read(path.join("views", "assets", "js", file));
    assert.match(source, /LeoniAuth\.ensureAccess\(/, file);
    assert.doesNotMatch(source, /LeoniAuth\.refreshSession\(/, file);
  }
});

test("dashboard contains no browser-local target-month calculation", () => {
  const dashboard = read("views/assets/js/dashboard.js");
  const helpers = read("utils/helpers.js");
  const controller = read("controllers/dashboardController.js");

  assert.match(dashboard, /LeoniAPI\.getPlanningGenerationWindow\(/);
  assert.doesNotMatch(dashboard, /new Date\(|toISOString\(\)|getDate\(\)/);
  assert.doesNotMatch(helpers, /getTargetMonthKey/);
  assert.match(controller, /PlanningGenerationWindowService/);
  assert.match(controller, /getTargetMonthContext/);
});
