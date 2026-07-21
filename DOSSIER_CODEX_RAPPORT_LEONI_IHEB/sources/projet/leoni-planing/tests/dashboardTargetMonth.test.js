const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { buildPlanningGenerationWindow } = require("../utils/planningGenerationWindow");

const state = {
  window: buildPlanningGenerationWindow("2026-07-25T12:00:00Z"),
  windowCalls: 0,
  queryParams: [],
};

const fakeDb = {
  async query(sql, params) {
    state.queryParams.push(params);
    if (sql.includes("totalUsers")) {
      return [[{ totalUsers: 2, totalEmployees: 1 }]];
    }
    if (sql.includes("groupA")) {
      return [[{ groupA: 1, groupB: 0 }]];
    }
    return [[{ totalPlanning: 1, planningCompleted: 1 }]];
  },
};

const fakeWindowService = {
  async getPlanningGenerationWindow() {
    state.windowCalls += 1;
    return state.window;
  },
};

function stubModule(relativePath, exports) {
  const resolved = require.resolve(path.join(__dirname, "..", relativePath));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

stubModule("config/db.js", fakeDb);
stubModule("services/PlanningGenerationWindowService.js", fakeWindowService);

const dashboardController = require("../controllers/dashboardController");

function invokeGetStats(query = {}) {
  return new Promise((resolve, reject) => {
    const req = { query };
    const res = {
      json(payload) {
        resolve(payload);
      },
    };
    dashboardController.getStats(req, res, reject);
  });
}

test.beforeEach(() => {
  state.window = buildPlanningGenerationWindow("2026-07-25T12:00:00Z");
  state.windowCalls = 0;
  state.queryParams = [];
});

test("dashboard default month comes from the authoritative Africa/Tunis window", async () => {
  const response = await invokeGetStats();

  assert.equal(response.monthKey, "2026-08");
  assert.equal(state.windowCalls, 1);
  assert.equal(state.queryParams[1][0], "2026-08");
  assert.equal(state.queryParams[2][0], "2026-08");
});

test("dashboard preserves an explicitly requested month", async () => {
  const response = await invokeGetStats({ month: "2026-10" });

  assert.equal(response.monthKey, "2026-10");
  assert.equal(state.windowCalls, 0);
  assert.equal(state.queryParams[1][0], "2026-10");
  assert.equal(state.queryParams[2][0], "2026-10");
});
