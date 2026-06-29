/**
 * Shared utility helpers.
 *
 * Extracted from controllers to eliminate duplication.
 * - normalizeGroupId was duplicated in authController and planningController
 * - Response helpers standardize API responses across all endpoints
 */

const { GROUPS } = require("../config/constants");

/**
 * Normalize a group_id value from request input.
 * Accepts "A", "B", 1, 2, "1", "2" — returns integer or null.
 * @param {*} groupId
 * @returns {number|null}
 */
function normalizeGroupId(groupId) {
  if (groupId == null || groupId === "") return null;
  const g = String(groupId).toUpperCase();
  if (g === "A") return GROUPS.A;
  if (g === "B") return GROUPS.B;
  const num = parseInt(groupId, 10);
  return Number.isNaN(num) ? null : num;
}

/**
 * Build a standard success response.
 * @param {object} res  — Express response
 * @param {object} data — Payload
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

/**
 * Build a standard error response.
 * @param {object} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {*} [details=null]
 */
function sendError(res, message, statusCode = 500, details = null) {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

/**
 * Determine if the request expects a JSON response (API call)
 * vs. a page navigation (browser URL bar).
 */
function wantsJson(req) {
  return (
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.path.startsWith("/api/")
  );
}

/**
 * Calculate the target month key based on the day-25 business rule.
 * After the 25th, the target validation month shifts to the next month.
 * @param {Date} [today]
 * @returns {{ monthKey: string, isNextMonth: boolean }}
 */
function getTargetMonthKey(today = new Date()) {
  let monthKey = today.toISOString().slice(0, 7);
  let isNextMonth = false;

  if (today.getDate() >= 25) {
    isNextMonth = true;
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    monthKey = nextMonth.toISOString().slice(0, 7);
  }

  return { monthKey, isNextMonth };
}

module.exports = {
  normalizeGroupId,
  sendSuccess,
  sendError,
  wantsJson,
  getTargetMonthKey,
};
