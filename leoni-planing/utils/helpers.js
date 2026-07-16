/**
 * Shared utility helpers.
 *
 * Shared group and request helpers.
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

module.exports = {
  normalizeGroupId,
  wantsJson,
};
