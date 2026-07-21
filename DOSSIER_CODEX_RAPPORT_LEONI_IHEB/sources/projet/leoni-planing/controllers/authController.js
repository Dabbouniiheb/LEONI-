/**
 * Authentication controller for session, login, logout, and password-change flows.
 */

const bcrypt = require("bcrypt");
const db = require("../config/db");
const { AUDIT_ACTIONS, VALIDATION_RULES } = require("../config/constants");
const { getPermissionsForRole } = require("../config/permissions");
const { logAction } = require("../utils/logger");
const asyncHandler = require("../utils/asyncHandler");

function sessionUserPayload(userRow) {
  return {
    id: userRow.id,
    name: `${userRow.first_name} ${userRow.last_name}`,
    role: userRow.role,
    group_id: userRow.group_id,
    must_change_password: !!userRow.must_change_password,
    first_login: !!userRow.first_login,
    permissions: getPermissionsForRole(userRow.role),
  };
}

exports.getSession = (req, res) => {
  if (!req.session.user) {
    return res.json({ user: null });
  }
  req.session.user.permissions = getPermissionsForRole(req.session.user.role);
  res.json({ user: req.session.user });
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? AND is_deleted = 0",
    [email]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const user = rows[0];
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ success: false, message: "Wrong password" });
  }

  req.session.user = sessionUserPayload(user);

  await logAction(user.id, AUDIT_ACTIONS.LOGIN, null, req.ip);

  let redirect = "/dashboard";
  if (req.session.user.first_login || req.session.user.must_change_password) {
    redirect = "/change-password";
  }

  const { password: _pwd, ...safeUser } = user;
  safeUser.must_change_password = !!user.must_change_password;
  safeUser.first_login = !!user.first_login;
  safeUser.name = `${user.first_name} ${user.last_name}`;
  safeUser.permissions = getPermissionsForRole(user.role);

  res.json({
    success: true,
    message: "Login success",
    user: safeUser,
    redirect,
  });
});

exports.logout = (req, res) => {
  const userId = req.session.user?.id;
  req.session.destroy(async (err) => {
    if (err) return res.status(500).json({ success: false, message: "Logout failed" });
    if (userId) await logAction(userId, AUDIT_ACTIONS.LOGOUT);
    res.clearCookie("leoni_session");
    res.json({ success: true, message: "Logged out" });
  });
};

exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  const [rows] = await db.query("SELECT password FROM users WHERE id = ? AND is_deleted = 0", [userId]);
  if (!rows.length) return res.status(404).json({ success: false, message: "User not found" });

  const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" });
  }

  const hashed = await bcrypt.hash(newPassword, VALIDATION_RULES.BCRYPT_SALT_ROUNDS);

  await db.query(
    `UPDATE users SET password = ?, must_change_password = 0, first_login = 0 WHERE id = ? AND is_deleted = 0`,
    [hashed, userId]
  );

  req.session.user.must_change_password = false;
  req.session.user.first_login = false;

  await logAction(userId, AUDIT_ACTIONS.PASSWORD_CHANGED, "First login / forced change completed", req.ip);

  res.json({ success: true, message: "Password updated", redirect: "/dashboard" });
});
