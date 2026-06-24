const bcrypt = require("bcrypt");
const db = require("../config/db");
const { logAction } = require("../utils/logger");

exports.getUsers = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT id, first_name, last_name, CONCAT(first_name, ' ', last_name) AS name,
              username, email, role, group_id, matricule, department
       FROM users`
    );
    res.json(results);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createUser = async (req, res) => {
  const { first_name, last_name, username, email, password, role, matricule, department } = req.body;

  if (!first_name || !last_name || !username || !email || !password || !matricule || !department) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if user already exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? OR username = ? OR matricule = ?",
      [email.trim(), username.trim(), matricule.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email, Username, or Matricule already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = role || "Data Cleansing";

    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, username, email, password, role, matricule, department, must_change_password, first_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        first_name.trim(),
        last_name.trim(),
        username.trim(),
        email.trim(),
        hashedPassword,
        userRole,
        matricule.trim(),
        department.trim(),
      ]
    );

    const newUserId = result.insertId;
    await logAction(
      req.session.user.id,
      "CREATE_USER",
      `Created user ${username} (${email}) with role ${userRole}`
    );

    res.status(201).json({ message: "User created successfully", userId: newUserId });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { first_name, last_name, role, matricule, department, group_id } = req.body;
  const targetId = req.params.id;

  if (!first_name || !last_name || !role || !matricule || !department) {
    return res.status(400).json({ message: "Missing fields to update" });
  }

  try {
    // Check if target exists
    const [existing] = await db.query("SELECT id FROM users WHERE id = ?", [targetId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalizedGroupId = group_id === "" || group_id == null ? null : parseInt(group_id, 10);

    await db.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, role = ?, matricule = ?, department = ?, group_id = ?
       WHERE id = ?`,
      [
        first_name.trim(),
        last_name.trim(),
        role,
        matricule.trim(),
        department.trim(),
        normalizedGroupId,
        targetId,
      ]
    );

    await logAction(
      req.session.user.id,
      "UPDATE_USER",
      `Updated user ID ${targetId} details`
    );

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  const targetId = req.params.id;

  try {
    const [existing] = await db.query("SELECT id, username FROM users WHERE id = ?", [targetId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.query("DELETE FROM users WHERE id = ?", [targetId]);

    await logAction(
      req.session.user.id,
      "DELETE_USER",
      `Deleted user ID ${targetId} (${existing[0].username})`
    );

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
