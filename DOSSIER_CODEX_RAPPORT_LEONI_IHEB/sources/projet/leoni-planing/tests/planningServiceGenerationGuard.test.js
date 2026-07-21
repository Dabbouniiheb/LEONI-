const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildPlanningGenerationWindow,
  validatePlanningGenerationWindow,
} = require("../utils/planningGenerationWindow");

const state = {
  utcInstant: "2026-07-25T12:00:00Z",
  userExists: true,
  planningExists: false,
  selectionMonth: "2026-08",
  groupId: 1,
  batchValues: null,
  committed: false,
  rolledBack: false,
};

const fakeConnection = {
  async beginTransaction() {},
  async commit() { state.committed = true; },
  async rollback() { state.rolledBack = true; },
  release() {},
};

const fakeDb = {
  async getConnection() { return fakeConnection; },
};

const fakePlanning = {
  async findUserForPlanning() {
    return state.userExists ? { id: 2, role: "Data Cleansing" } : null;
  },
  async existsForMonth(_userId, month) {
    assert.equal(month, "2026-08");
    return state.planningExists;
  },
  async batchInsert(values) {
    state.batchValues = values;
  },
  async findByUserId() {
    return [];
  },
};

const fakeMonthlyGroupSelection = {
  async findByUserAndMonth(_userId, month) {
    return month === state.selectionMonth ? { group_id: state.groupId } : null;
  },
};

const fakeGenerationWindowService = {
  async getPlanningGenerationWindow() {
    return buildPlanningGenerationWindow(state.utcInstant);
  },
  validatePlanningGenerationWindow,
};

function stubModule(relativePath, exports) {
  const resolved = require.resolve(path.join(__dirname, "..", relativePath));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

stubModule("config/db.js", fakeDb);
stubModule("models/Planning.js", fakePlanning);
stubModule("models/MonthlyGroupSelection.js", fakeMonthlyGroupSelection);
stubModule("services/PlanningGenerationWindowService.js", fakeGenerationWindowService);

const PlanningService = require("../services/PlanningService");

test.beforeEach(() => {
  state.utcInstant = "2026-07-25T12:00:00Z";
  state.userExists = true;
  state.planningExists = false;
  state.selectionMonth = "2026-08";
  state.groupId = 1;
  state.batchValues = null;
  state.committed = false;
  state.rolledBack = false;
});

test("closed window rejects before any planning insert", async () => {
  state.utcInstant = "2026-07-24T12:00:00Z";

  await assert.rejects(
    PlanningService.generatePlanning(2, "2026-08"),
    (error) => error.code === "PLANNING_GENERATION_WINDOW_CLOSED"
  );
  assert.equal(state.batchValues, null);
  assert.equal(state.committed, false);
  assert.equal(state.rolledBack, true);
});

test("invalid generation month format uses a typed bad-request error", async () => {
  await assert.rejects(
    PlanningService.generatePlanning(2, "invalid"),
    (error) => {
      assert.equal(error.name, "BadRequestError");
      assert.equal(error.statusCode, 400);
      assert.equal(error.isOperational, true);
      assert.equal(error.message, "Invalid month format. Expected YYYY-MM");
      return true;
    }
  );
});

test("missing planning user uses a typed not-found error", async () => {
  state.userExists = false;

  await assert.rejects(
    PlanningService.generatePlanning(999, "2026-08"),
    (error) => {
      assert.equal(error.name, "NotFoundError");
      assert.equal(error.statusCode, 404);
      assert.equal(error.isOperational, true);
      assert.equal(error.message, "User not found");
      return true;
    }
  );
  assert.equal(state.rolledBack, true);
});

test("cross-user planning access uses a typed forbidden error with the existing client message", async () => {
  await assert.rejects(
    PlanningService.getPlanningByUser(99, { id: 2, role: "Data Cleansing" }, {
      TEAM_LEADER: "Team Leader",
    }),
    (error) => {
      assert.equal(error.name, "ForbiddenError");
      assert.equal(error.statusCode, 403);
      assert.equal(error.isOperational, true);
      assert.equal(error.message, "Access forbidden: cannot view other users' planning");
      return true;
    }
  );
});

test("planning controller does not classify operational errors by message text", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "controllers", "planningController.js"),
    "utf8"
  );
  assert.doesNotMatch(source, /err\.message\s*===/);
});

test("open window rejects every requested month except the backend allowed month", async () => {
  for (const month of ["2026-07", "2026-09", "2025-08"]) {
    state.rolledBack = false;
    await assert.rejects(
      PlanningService.generatePlanning(2, month),
      (error) => error.code === "INVALID_PLANNING_GENERATION_MONTH",
      month
    );
    assert.equal(state.batchValues, null, month);
    assert.equal(state.rolledBack, true, month);
  }
});

test("selection from a previous month is not reused", async () => {
  state.selectionMonth = "2026-07";

  await assert.rejects(
    PlanningService.generatePlanning(2, "2026-08"),
    (error) => error.code === "MONTHLY_GROUP_SELECTION_REQUIRED"
  );
  assert.equal(state.batchValues, null);
});

test("existing planning is rejected without duplicate inserts", async () => {
  state.planningExists = true;

  await assert.rejects(
    PlanningService.generatePlanning(2, "2026-08"),
    (error) => error.code === "PLANNING_ALREADY_EXISTS"
  );
  assert.equal(state.batchValues, null);
});

test("Group A selection generates only the backend allowed month", async () => {
  state.groupId = 1;
  const result = await PlanningService.generatePlanning(2, "2026-08");

  assert.equal(result.groupCode, "A");
  assert.equal(result.generationWindow.allowed_month, "2026-08");
  assert.ok(result.planningDays.length > 0);
  assert.ok(result.planningDays.every((day) => day.date.startsWith("2026-08-")));
  assert.ok(state.batchValues.every((row) => row[3] === "2026-08"));
  assert.equal(state.committed, true);
});

test("Group B selection generates only the backend allowed month", async () => {
  state.groupId = 2;
  const result = await PlanningService.generatePlanning(2, "2026-08");

  assert.equal(result.groupCode, "B");
  assert.equal(result.generationWindow.allowed_month, "2026-08");
  assert.ok(result.planningDays.length > 0);
  assert.ok(result.planningDays.every((day) => day.date.startsWith("2026-08-")));
  assert.ok(state.batchValues.every((row) => row[3] === "2026-08"));
  assert.equal(state.committed, true);
});
