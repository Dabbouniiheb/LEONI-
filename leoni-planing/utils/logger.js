/**
 * Audit Logger — User action tracking.
 *
 * Records business-level events (login, user CRUD, planning, exports)
 * into the audit_logs table, including a client IP address when provided.
 *
 * This is separate from the application logger (appLogger.js)
 * which handles system/debug logging.
 */

const db = require("../config/db");
const logger = require("./appLogger");

/**
 * Log a user action to the audit_logs table.
 * @param {number|null} userId
 * @param {string} action   — Use constants from AUDIT_ACTIONS
 * @param {string|null} details
 * @param {string|null} ipAddress — Client IP
 */
async function logAction(userId, action, details = null, ipAddress = null) {
  try {
    await db.query(
      "INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
      [userId || null, action, details, ipAddress]
    );
  } catch (err) {
    logger.error("Audit log insertion failed", { error: err, action, userId });
  }
}

module.exports = { logAction };
