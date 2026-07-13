const db = require("../config/db");

class Planning {
  static async getAuthoritativeUtcClock(connection = db) {
    const [rows] = await connection.query(
      "SELECT DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%sZ') AS utc_now"
    );
    return rows[0];
  }

  static async findUserForPlanning(userId, connection = db) {
    const [rows] = await connection.query(
      `SELECT id, role, first_name, last_name
       FROM users
       WHERE id = ? AND is_deleted = 0
       FOR UPDATE`,
      [userId]
    );
    return rows[0] || null;
  }

  static async existsForMonth(userId, month, connection = db) {
    const [[row]] = await connection.query(
      `SELECT EXISTS(
         SELECT 1 FROM planning WHERE user_id = ? AND month_key = ?
       ) AS planning_exists`,
      [userId, month]
    );
    return Boolean(row.planning_exists);
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
              CONCAT(users.first_name, ' ', users.last_name) AS user_name, mgs.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       LEFT JOIN monthly_group_selections mgs
         ON mgs.user_id = planning.user_id AND mgs.month_key = planning.month_key
       ${whereClause}
       ORDER BY users.first_name, users.last_name, planning.date`,
      params
    );
    return results;
  }

  static async findByUserId(userId) {
    const [results] = await db.query(
      `SELECT planning.*, CONCAT(users.first_name, ' ', users.last_name) AS name,
              mgs.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       LEFT JOIN monthly_group_selections mgs
         ON mgs.user_id = planning.user_id AND mgs.month_key = planning.month_key
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
              CONCAT(users.first_name, ' ', users.last_name) AS user_name, mgs.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       LEFT JOIN monthly_group_selections mgs
         ON mgs.user_id = planning.user_id AND mgs.month_key = planning.month_key
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
              mgs.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       LEFT JOIN monthly_group_selections mgs
         ON mgs.user_id = planning.user_id AND mgs.month_key = planning.month_key
       ${whereClause}
       ORDER BY planning.month_key ASC, users.first_name, users.last_name, planning.date ASC`,
      params
    );
    return results;
  }
}

module.exports = Planning;
