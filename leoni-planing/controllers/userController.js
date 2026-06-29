/**
 * User Management Controller
 *
 * Changes from original:
 * - Soft delete (is_deleted flag) instead of permanent DELETE
 * - Async bcrypt.hash instead of bcrypt.hashSync
 * - Uses constants instead of magic strings
 * - Filters out soft-deleted users in all queries
 * - Uses structured logger
 * - Uses asyncHandler and express-validator
 */

const bcrypt = require("bcrypt");
const db = require("../config/db");
const { AUDIT_ACTIONS, VALIDATION_RULES } = require("../config/constants");
const { logAction } = require("../utils/logger");
const logger = require("../utils/appLogger");
const asyncHandler = require("../utils/asyncHandler");

exports.getUsers = asyncHandler(async (req, res) => {
  const [results] = await db.query(
    `SELECT id, first_name, last_name, CONCAT(first_name, ' ', last_name) AS name,
            username, email, role, group_id, matricule, department
     FROM users
     WHERE is_deleted = 0`
  );
  res.json(results);
});

exports.createUser = asyncHandler(async (req, res) => {
  const { first_name, last_name, username, email, password, role, matricule, department } = req.body;

  // Check if user already exists (including soft-deleted — prevent matricule reuse)
  const [existing] = await db.query(
    "SELECT id, is_deleted FROM users WHERE (email = ? OR username = ? OR matricule = ?)",
    [email, username, matricule]
  );
  if (existing.length > 0) {
    return res.status(409).json({ success: false, message: "Email, Username, or Matricule already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, VALIDATION_RULES.BCRYPT_SALT_ROUNDS);
  const userRole = role || "Data Cleansing";

  const [result] = await db.query(
    `INSERT INTO users (first_name, last_name, username, email, password, role, matricule, department, must_change_password, first_login)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
    [
      first_name,
      last_name,
      username,
      email,
      hashedPassword,
      userRole,
      matricule,
      department,
    ]
  );

  const newUserId = result.insertId;
  await logAction(
    req.session.user.id,
    AUDIT_ACTIONS.CREATE_USER,
    `Created user ${username} (${email}) with role ${userRole}`,
    req.ip
  );

  res.status(201).json({ success: true, message: "User created successfully", userId: newUserId });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { first_name, last_name, role, matricule, department, group_id } = req.body;
  const targetId = req.params.id;

  const [existing] = await db.query("SELECT id FROM users WHERE id = ? AND is_deleted = 0", [targetId]);
  if (existing.length === 0) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const normalizedGroupId = group_id === "" || group_id == null ? null : parseInt(group_id, 10);

  await db.query(
    `UPDATE users
     SET first_name = ?, last_name = ?, role = ?, matricule = ?, department = ?, group_id = ?
     WHERE id = ?`,
    [
      first_name,
      last_name,
      role,
      matricule,
      department,
      normalizedGroupId,
      targetId,
    ]
  );

  await logAction(
    req.session.user.id,
    AUDIT_ACTIONS.UPDATE_USER,
    `Updated user ID ${targetId} details`,
    req.ip
  );

  res.json({ success: true, message: "User updated successfully" });
});

/**
 * Soft Delete — sets is_deleted = 1, deleted_at = NOW()
 * User data is preserved for audit trail and historical reporting.
 * The user's planning records are kept (FK constraint still enforced).
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  const [existing] = await db.query(
    "SELECT id, username FROM users WHERE id = ? AND is_deleted = 0",
    [targetId]
  );
  if (existing.length === 0) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Soft delete instead of permanent deletion
  await db.query(
    "UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?",
    [targetId]
  );

  await logAction(
    req.session.user.id,
    AUDIT_ACTIONS.DELETE_USER,
    `Soft-deleted user ID ${targetId} (${existing[0].username})`,
    req.ip
  );

  res.json({ success: true, message: "User deleted successfully" });
});
