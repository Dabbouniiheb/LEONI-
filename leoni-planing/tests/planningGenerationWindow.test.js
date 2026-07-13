const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildPlanningGenerationWindow,
  validatePlanningGenerationWindow,
} = require("../utils/planningGenerationWindow");

function windowAt(dateKey, time = "12:00:00Z") {
  return buildPlanningGenerationWindow(`${dateKey}T${time}`);
}

test("generation is closed from day 1 through day 24", () => {
  for (const dateKey of ["2026-07-01", "2026-07-24", "2026-08-01", "2026-08-24"]) {
    const window = windowAt(dateKey);
    assert.equal(window.is_open, false, dateKey);
    assert.equal(window.allowed_month, null, dateKey);
  }
});

test("July window is open from day 25 through day 31 for August only", () => {
  for (const dateKey of ["2026-07-25", "2026-07-30", "2026-07-31"]) {
    const window = windowAt(dateKey);
    assert.equal(window.is_open, true, dateKey);
    assert.equal(window.allowed_month, "2026-08", dateKey);
    assert.equal(window.opens_on, "2026-07-25", dateKey);
    assert.equal(window.closes_on, "2026-07-31", dateKey);
  }
});

test("August window is open from day 25 through day 31 for September only", () => {
  for (const dateKey of ["2026-08-25", "2026-08-30", "2026-08-31"]) {
    const window = windowAt(dateKey);
    assert.equal(window.is_open, true, dateKey);
    assert.equal(window.allowed_month, "2026-09", dateKey);
  }
});

test("non-leap February remains open through February 28 for March", () => {
  for (const dateKey of ["2026-02-25", "2026-02-28"]) {
    const window = windowAt(dateKey);
    assert.equal(window.is_open, true, dateKey);
    assert.equal(window.allowed_month, "2026-03", dateKey);
    assert.equal(window.closes_on, "2026-02-28", dateKey);
  }
});

test("leap-year February remains open through February 29 for March", () => {
  for (const dateKey of ["2028-02-25", "2028-02-29"]) {
    const window = windowAt(dateKey);
    assert.equal(window.is_open, true, dateKey);
    assert.equal(window.allowed_month, "2028-03", dateKey);
    assert.equal(window.closes_on, "2028-02-29", dateKey);
  }
});

test("30-day month closes on its actual final day", () => {
  const window = windowAt("2026-04-30");
  assert.equal(window.is_open, true);
  assert.equal(window.allowed_month, "2026-05");
  assert.equal(window.closes_on, "2026-04-30");
});

test("December window rolls over to January of the next year", () => {
  for (const dateKey of ["2026-12-25", "2026-12-31"]) {
    const window = windowAt(dateKey);
    assert.equal(window.is_open, true, dateKey);
    assert.equal(window.allowed_month, "2027-01", dateKey);
  }
});

test("Africa/Tunis business date controls opening and automatic closing", () => {
  const opensAfterUtcMidnightOffset = buildPlanningGenerationWindow("2026-07-24T23:30:00Z");
  assert.equal(opensAfterUtcMidnightOffset.server_date, "2026-07-25");
  assert.equal(opensAfterUtcMidnightOffset.is_open, true);
  assert.equal(opensAfterUtcMidnightOffset.timezone, "Africa/Tunis");

  const closesAfterUtcMidnightOffset = buildPlanningGenerationWindow("2026-07-31T23:30:00Z");
  assert.equal(closesAfterUtcMidnightOffset.server_date, "2026-08-01");
  assert.equal(closesAfterUtcMidnightOffset.is_open, false);
  assert.equal(closesAfterUtcMidnightOffset.allowed_month, null);
});

test("validation allows only the backend-calculated next month", () => {
  const window = windowAt("2026-07-25");
  assert.equal(validatePlanningGenerationWindow("2026-08", window), "2026-08");

  for (const month of ["2026-07", "2026-09", "2025-08", "invalid"]) {
    assert.throws(
      () => validatePlanningGenerationWindow(month, window),
      (error) => error.code === "INVALID_PLANNING_GENERATION_MONTH",
      month
    );
  }
});

test("validation rejects every month while the window is closed", () => {
  const window = windowAt("2026-07-24");
  assert.throws(
    () => validatePlanningGenerationWindow("2026-08", window),
    (error) => error.code === "PLANNING_GENERATION_WINDOW_CLOSED"
  );
});
