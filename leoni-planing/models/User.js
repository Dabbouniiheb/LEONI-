const db = require("../config/db");

class User {
  static async findAllActive() {
    const [rows] = await db.query(
      `SELECT id, first_name, last_name, CONCAT(first_name, ' ', last_name) AS name,
              username, email, role, group_id, matricule, department, must_change_password, first_login
       FROM users
       WHERE is_deleted = 0`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE id = ? AND is_deleted = 0",
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND is_deleted = 0",
      [email]
    );
    return rows[0] || null;
  }

  static async findConflicts(email, username, matricule) {
    const [rows] = await db.query(
      "SELECT id, is_deleted FROM users WHERE (email = ? OR username = ? OR matricule = ?)",
      [email, username, matricule]
    );
    return rows;
  }

  static async create(userData) {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      role,
      matricule,
      department,
    } = userData;

    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, username, email, password, role, matricule, department, must_change_password, first_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        first_name,
        last_name,
        username,
        email,
        password,
        role,
        matricule,
        department,
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, updateData) {
    const { first_name, last_name, role, matricule, department } = updateData;
    await db.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, role = ?, matricule = ?, department = ?
       WHERE id = ? AND is_deleted = 0`,
      [
        first_name,
        last_name,
        role,
        matricule,
        department,
        id,
      ]
    );
  }

  static async softDelete(id) {
    await db.query(
      "UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND is_deleted = 0",
      [id]
    );
  }

  static async updatePassword(id, hashedPassword) {
    await db.query(
      `UPDATE users SET password = ?, must_change_password = 0, first_login = 0 WHERE id = ? AND is_deleted = 0`,
      [hashedPassword, id]
    );
  }

}

module.exports = User;
