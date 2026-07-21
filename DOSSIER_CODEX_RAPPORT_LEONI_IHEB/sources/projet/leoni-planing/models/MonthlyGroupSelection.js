const db = require("../config/db");

class MonthlyGroupSelection {
  static async findActiveUser(userId, connection = db, forUpdate = false) {
    const [rows] = await connection.query(
      `SELECT id, role, first_name, last_name, matricule
       FROM users
       WHERE id = ? AND is_deleted = 0
       ${forUpdate ? "FOR UPDATE" : ""}`,
      [userId]
    );
    return rows[0] || null;
  }

  static async findByUserAndMonth(userId, monthKey, connection = db, forUpdate = false) {
    const [rows] = await connection.query(
      `SELECT id, user_id, month_key, group_id, created_at, updated_at
       FROM monthly_group_selections
       WHERE user_id = ? AND month_key = ?
       ${forUpdate ? "FOR UPDATE" : ""}`,
      [userId, monthKey]
    );
    return rows[0] || null;
  }

  static async upsert(userId, monthKey, groupId, connection = db) {
    await connection.query(
      `INSERT INTO monthly_group_selections (user_id, month_key, group_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         group_id = VALUES(group_id),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, monthKey, groupId]
    );
    return this.findByUserAndMonth(userId, monthKey, connection);
  }

  static async planningExists(userId, monthKey, connection = db) {
    const [[row]] = await connection.query(
      `SELECT EXISTS(
         SELECT 1
         FROM planning
         WHERE user_id = ? AND month_key = ?
       ) AS planning_exists`,
      [userId, monthKey]
    );
    return Boolean(row.planning_exists);
  }

  static async listForMonth(monthKey, employeeRole, connection = db) {
    const [rows] = await connection.query(
      `SELECT
         u.id AS user_id,
         CONCAT(u.first_name, ' ', u.last_name) AS user_name,
         u.matricule,
         mgs.id AS selection_id,
         mgs.group_id,
         mgs.created_at,
         mgs.updated_at,
         EXISTS(
           SELECT 1
           FROM planning p
           WHERE p.user_id = u.id AND p.month_key = ?
         ) AS planning_exists
       FROM users u
       LEFT JOIN monthly_group_selections mgs
         ON mgs.user_id = u.id AND mgs.month_key = ?
       WHERE u.is_deleted = 0 AND u.role = ?
       ORDER BY u.first_name, u.last_name`,
      [monthKey, monthKey, employeeRole]
    );
    return rows;
  }

}

module.exports = MonthlyGroupSelection;
