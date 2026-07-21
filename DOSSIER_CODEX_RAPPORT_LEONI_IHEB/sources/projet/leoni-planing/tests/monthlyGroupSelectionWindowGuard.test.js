const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  buildPlanningGenerationWindow,
  validatePlanningGenerationWindow,
} = require("../utils/planningGenerationWindow");

const state = {
  utcInstant: "2026-07-25T12:00:00Z",
  upserted: null,
  committed: false,
  rolledBack: false,
  audited: false,
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

const fakeMonthlyGroupSelection = {
  async findActiveUser() { return { id: 2, role: "Data Cleansing" }; },
  async findByUserAndMonth() { return null; },
  async planningExists() { return false; },
  async upsert(userId, monthKey, groupId) {
    state.upserted = { userId, monthKey, groupId };
    return { user_id: userId, month_key: monthKey, group_id: groupId };
  },
};

const fakeGenerationWindowService = {
  async getPlanningGenerationWindow() {
    return buildPlanningGenerationWindow(state.utcInstant);
  },
  validatePlanningGenerationWindow,
};

const fakeAuditLogger = {
  async logAction() { state.audited = true; },
};

function stubModule(relativePath, exports) {
  const resolved = require.resolve(path.join(__dirname, "..", relativePath));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

stubModule("config/db.js", fakeDb);
stubModule("models/MonthlyGroupSelection.js", fakeMonthlyGroupSelection);
stubModule("services/PlanningGenerationWindowService.js", fakeGenerationWindowService);
stubModule("utils/logger.js", fakeAuditLogger);

const MonthlyGroupSelectionService = require("../services/MonthlyGroupSelectionService");

test.beforeEach(() => {
  state.utcInstant = "2026-07-25T12:00:00Z";
  state.upserted = null;
  state.committed = false;
  state.rolledBack = false;
  state.audited = false;
});

test("monthly group selection cannot be saved while generation is closed", async () => {
  state.utcInstant = "2026-07-24T12:00:00Z";

  await assert.rejects(
    MonthlyGroupSelectionService.saveMine(2, "2026-08", 1),
    (error) => error.code === "PLANNING_GENERATION_WINDOW_CLOSED"
  );
  assert.equal(state.upserted, null);
  assert.equal(state.rolledBack, true);
});

test("monthly group selection cannot be saved for a different month", async () => {
  await assert.rejects(
    MonthlyGroupSelectionService.saveMine(2, "2026-09", 1),
    (error) => error.code === "INVALID_PLANNING_GENERATION_MONTH"
  );
  assert.equal(state.upserted, null);
});

test("monthly group selection is saved for the allowed next month", async () => {
  const result = await MonthlyGroupSelectionService.saveMine(2, "2026-08", 2);

  assert.deepEqual(state.upserted, { userId: 2, monthKey: "2026-08", groupId: 2 });
  assert.equal(result.month, "2026-08");
  assert.equal(result.selection.group_code, "B");
  assert.equal(state.committed, true);
  assert.equal(state.audited, true);
});
