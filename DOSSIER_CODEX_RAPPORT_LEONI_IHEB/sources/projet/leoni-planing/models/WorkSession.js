const db = require("../config/db");

class WorkSession {
  static async getServerClock(connection = db) {
    const [rows] = await connection.query(
      "SELECT NOW() AS now_at, DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today"
    );
    return rows[0];
  }

  static async findPlanningById(planningId, connection = db, options = {}) {
    const lockClause = options.lock ? " FOR UPDATE" : "";
    const [rows] = await connection.query(
      `SELECT p.id,
              p.user_id,
              DATE_FORMAT(p.date, '%Y-%m-%d') AS work_date,
              p.status,
              p.month_key,
              p.work_hour,
              p.planned_work_hour,
              p.horaire,
              u.role,
              u.group_id,
              u.is_deleted
       FROM planning p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?${lockClause}`,
      [planningId]
    );
    return rows[0] || null;
  }

  static async findPlanningByUserDate(userId, workDate, connection = db, options = {}) {
    const lockClause = options.lock ? " FOR UPDATE" : "";
    const [rows] = await connection.query(
      `SELECT p.id,
              p.user_id,
              DATE_FORMAT(p.date, '%Y-%m-%d') AS work_date,
              p.status,
              p.month_key,
              p.work_hour,
              p.planned_work_hour,
              p.horaire,
              u.role,
              u.group_id,
              u.is_deleted
       FROM planning p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? AND p.date = ?
       LIMIT 1${lockClause}`,
      [userId, workDate]
    );
    return rows[0] || null;
  }

  static async findActiveForPlanning(userId, planningId, workDate, connection = db, options = {}) {
    const lockClause = options.lock ? " FOR UPDATE" : "";
    const [rows] = await connection.query(
      `SELECT ${this.selectColumns()}
       FROM work_sessions
       WHERE user_id = ?
         AND planning_id = ?
         AND work_date = ?
         AND status = 'active'
       ORDER BY id DESC
       LIMIT 1${lockClause}`,
      [userId, planningId, workDate]
    );
    return rows[0] || null;
  }

  static async findLatestPausedForPlanning(userId, planningId, workDate, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${this.selectColumns()}
       FROM work_sessions
       WHERE user_id = ?
         AND planning_id = ?
         AND work_date = ?
         AND status = 'paused'
       ORDER BY id DESC
       LIMIT 1`,
      [userId, planningId, workDate]
    );
    return rows[0] || null;
  }

  static async create({ userId, planningId, workDate, now }, connection = db) {
    const [result] = await connection.query(
      `INSERT INTO work_sessions
         (user_id, planning_id, work_date, started_at, last_heartbeat_at, active_seconds, status, active_slot)
       VALUES (?, ?, ?, ?, ?, 0, 'active', 1)`,
      [userId, planningId, workDate, now, now]
    );
    return this.findById(result.insertId, connection);
  }

  static async findById(sessionId, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${this.selectColumns()}
       FROM work_sessions
       WHERE id = ?`,
      [sessionId]
    );
    return rows[0] || null;
  }

  static async findByIdForUpdate(sessionId, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${this.selectColumns()}
       FROM work_sessions
       WHERE id = ?
       FOR UPDATE`,
      [sessionId]
    );
    return rows[0] || null;
  }

  static async updateTiming(sessionId, data, connection = db) {
    const {
      activeSeconds,
      lastHeartbeatAt,
      status,
      endedAt = null,
    } = data;
    const activeSlot = status === "active" ? 1 : null;

    await connection.query(
      `UPDATE work_sessions
       SET active_seconds = ?,
           last_heartbeat_at = ?,
           status = ?,
           active_slot = ?,
           ended_at = ?
       WHERE id = ?`,
      [activeSeconds, lastHeartbeatAt, status, activeSlot, endedAt, sessionId]
    );
    return this.findById(sessionId, connection);
  }

  static async resume(sessionId, now, connection = db) {
    await connection.query(
      `UPDATE work_sessions
       SET status = 'active',
           last_heartbeat_at = ?,
           active_slot = 1,
           ended_at = NULL
       WHERE id = ? AND status = 'paused'`,
      [now, sessionId]
    );
    return this.findById(sessionId, connection);
  }

  static async findByUserDate(userId, workDate, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${this.selectColumns()}
       FROM work_sessions
       WHERE user_id = ? AND work_date = ?
       ORDER BY started_at DESC, id DESC`,
      [userId, workDate]
    );
    return rows;
  }

  static async findCurrentActiveSession(userId, workDate, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${this.selectColumns()}
       FROM work_sessions
       WHERE user_id = ? AND work_date = ? AND status = 'active'
       ORDER BY started_at DESC, id DESC
       LIMIT 1`,
      [userId, workDate]
    );
    return rows[0] || null;
  }

  static async sumActiveSecondsForDate(userId, workDate, connection = db) {
    const [rows] = await connection.query(
      `SELECT COALESCE(SUM(active_seconds), 0) AS total_active_seconds
       FROM work_sessions
       WHERE user_id = ? AND work_date = ?`,
      [userId, workDate]
    );
    return Number(rows[0]?.total_active_seconds || 0);
  }

  static async updatePlanningWorkHour(planningId, workHour, connection = db) {
    await connection.query(
      "UPDATE planning SET work_hour = ? WHERE id = ?",
      [workHour, planningId]
    );
  }

  static async findStaleActiveSessions(graceSeconds, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${this.selectColumns()}
       FROM work_sessions
       WHERE status = 'active'
         AND TIMESTAMPDIFF(SECOND, COALESCE(last_heartbeat_at, started_at), NOW()) > ?
       ORDER BY last_heartbeat_at ASC
       LIMIT 100
       FOR UPDATE`,
      [graceSeconds]
    );
    return rows;
  }

  static async getMonthlySummary({ startDate, endDate, userId, groupId }, connection = db) {
    const conditions = [
      "ws.work_date >= ?",
      "ws.work_date < ?",
      "u.is_deleted = 0",
    ];
    const params = [startDate, endDate];

    if (userId) {
      conditions.push("ws.user_id = ?");
      params.push(userId);
    }

    if (groupId) {
      conditions.push("u.group_id = ?");
      params.push(groupId);
    }

    const [rows] = await connection.query(
      `SELECT ws.user_id,
              CONCAT(u.first_name, ' ', u.last_name) AS user_name,
              u.matricule,
              u.department,
              u.group_id,
              DATE_FORMAT(ws.work_date, '%Y-%m-%d') AS work_date,
              COUNT(ws.id) AS session_count,
              COALESCE(SUM(ws.active_seconds), 0) AS total_active_seconds,
              ROUND(LEAST(COALESCE(SUM(ws.active_seconds), 0) / 3600, 8), 2) AS capped_hours,
              MAX(p.work_hour) AS planning_work_hour
       FROM work_sessions ws
       JOIN users u ON u.id = ws.user_id
       LEFT JOIN planning p ON p.id = ws.planning_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY ws.user_id,
                u.first_name,
                u.last_name,
                u.matricule,
                u.department,
                u.group_id,
                ws.work_date
       ORDER BY ws.work_date DESC, u.first_name, u.last_name`,
      params
    );
    return rows;
  }

  static selectColumns() {
    return `id,
            user_id,
            planning_id,
            DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
            started_at,
            last_heartbeat_at,
            ended_at,
            active_seconds,
            status,
            active_slot,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at`;
  }
}

module.exports = WorkSession;
