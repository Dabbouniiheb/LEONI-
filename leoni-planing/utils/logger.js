const db = require("../config/db");

async function logAction(userId, action, details = null) {
  try {
    await db.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)",
      [userId || null, action, details]
    );
  } catch (err) {
    console.error("❌ Audit log insertion failed:", err.message);
  }
}

module.exports = { logAction };
