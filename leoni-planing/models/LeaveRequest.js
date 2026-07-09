const db = require("../config/db");

class LeaveRequest {
  static selectColumns() {
    return `lr.id,
            lr.user_id,
            DATE_FORMAT(lr.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(lr.end_date, '%Y-%m-%d') AS end_date,
            lr.leave_type,
            lr.reason,
            lr.status,
            lr.decision_comment,
            lr.reviewed_by,
            DATE_FORMAT(lr.reviewed_at, '%Y-%m-%d %H:%i:%s') AS reviewed_at,
            DATE_FORMAT(lr.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            DATE_FORMAT(lr.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
            CONCAT(requester.first_name, ' ', requester.last_name) AS user_name,
            requester.matricule,
            requester.department,
            requester.group_id,
            CONCAT(reviewer.first_name, ' ', reviewer.last_name) AS reviewer_name`;
  }

  static async create(data) {
    const { user_id, start_date, end_date, leave_type, reason } = data;
    const [result] = await db.query(
      `INSERT INTO leave_requests (user_id, start_date, end_date, leave_type, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [user_id, start_date, end_date, leave_type, reason || null]
    );
    return this.findById(result.insertId);
  }

  static async findByUser(userId) {
    const [rows] = await db.query(
      `SELECT ${this.selectColumns()}
       FROM leave_requests lr
       JOIN users requester ON requester.id = lr.user_id
       LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
       WHERE lr.user_id = ? AND requester.is_deleted = 0
       ORDER BY lr.created_at DESC, lr.id DESC`,
      [userId]
    );
    return rows;
  }

  static async findAll() {
    const [rows] = await db.query(
      `SELECT ${this.selectColumns()}
       FROM leave_requests lr
       JOIN users requester ON requester.id = lr.user_id
       LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
       WHERE requester.is_deleted = 0
       ORDER BY FIELD(lr.status, 'pending', 'approved', 'rejected', 'cancelled'),
                lr.created_at DESC,
                lr.id DESC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT ${this.selectColumns()}
       FROM leave_requests lr
       JOIN users requester ON requester.id = lr.user_id
       LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
       WHERE lr.id = ? AND requester.is_deleted = 0`,
      [id]
    );
    return rows[0] || null;
  }

  static async findOverlapping(userId, startDate, endDate) {
    const [rows] = await db.query(
      `SELECT id
       FROM leave_requests
       WHERE user_id = ?
         AND status IN ('pending', 'approved')
         AND start_date <= ?
         AND end_date >= ?
       LIMIT 1`,
      [userId, endDate, startDate]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status, decisionComment, reviewerId) {
    const [result] = await db.query(
      `UPDATE leave_requests
       SET status = ?,
           decision_comment = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [status, decisionComment || null, reviewerId, id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  }

  static async cancel(id) {
    const [result] = await db.query(
      "UPDATE leave_requests SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
      [id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  }
}

module.exports = LeaveRequest;
