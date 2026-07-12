const db = require("../config/db");

class Planning {
  static async findUserForPlanning(userId, connection = db) {
    const [rows] = await connection.query(
      "SELECT group_id, role, first_name, last_name FROM users WHERE id = ? AND is_deleted = 0",
      [userId]
    );
    return rows[0] || null;
  }

  static async deleteForMonth(userId, month, connection = db) {
    await connection.query(
      "DELETE FROM planning WHERE user_id = ? AND month_key = ?",
      [userId, month]
    );
  }

  static async batchInsert(values, connection = db) {
    if (values.length === 0) return;
    await connection.query(
      "INSERT INTO planning (user_id, date, status, month_key, work_hour, planned_work_hour) VALUES ?",
      [values]
    );
  }

  static async findByFilters(conditions, params) {
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [results] = await db.query(
      `SELECT planning.id, planning.user_id, planning.date, planning.status,
              planning.month_key, planning.work_hour, planning.planned_work_hour, planning.horaire,
              CONCAT(users.first_name, ' ', users.last_name) AS user_name, users.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       ${whereClause}
       ORDER BY users.first_name, users.last_name, planning.date`,
      params
    );
    return results;
  }

  static async findByUserId(userId) {
    const [results] = await db.query(
      `SELECT planning.*, CONCAT(users.first_name, ' ', users.last_name) AS name
       FROM planning
       JOIN users ON users.id = planning.user_id
       WHERE planning.user_id = ? AND users.is_deleted = 0
       ORDER BY planning.date`,
      [userId]
    );
    return results;
  }

  static async findAll(conditions, params) {
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [results] = await db.query(
      `SELECT planning.id, planning.user_id, planning.date, planning.status,
              planning.month_key, planning.work_hour, planning.planned_work_hour, planning.horaire,
              CONCAT(users.first_name, ' ', users.last_name) AS user_name, users.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       ${whereClause}
       ORDER BY planning.id DESC`,
      params
    );
    return results;
  }

  static async findCalendarRows(conditions, params) {
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [results] = await db.query(
      `SELECT planning.user_id,
              DATE_FORMAT(planning.date, '%Y-%m-%d') AS date,
              planning.status,
              planning.month_key,
              planning.work_hour,
              planning.planned_work_hour,
              CONCAT(users.first_name, ' ', users.last_name) AS user_name,
              users.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       ${whereClause}
       ORDER BY planning.month_key ASC, users.first_name, users.last_name, planning.date ASC`,
      params
    );
    return results;
  }
}

module.exports = Planning;
