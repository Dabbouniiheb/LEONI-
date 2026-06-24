const bcrypt = require("bcrypt");
const db = require("../config/db");
const { logAction } = require("../utils/logger");

function sessionUserPayload(userRow) {
  return {
    id: userRow.id,
    name: `${userRow.first_name} ${userRow.last_name}`,
    role: userRow.role,
    group_id: userRow.group_id,
    must_change_password: !!userRow.must_change_password,
    first_login: !!userRow.first_login,
  };
}

function normalizeGroupIdParam(groupId) {
  if (groupId == null || groupId === "") return null;
  const g = String(groupId).toUpperCase();
  if (g === "A") return 1;
  if (g === "B") return 2;
  const num = parseInt(groupId, 10);
  return Number.isNaN(num) ? null : num;
}

exports.getSession = (req, res) => {
  if (!req.session.user) {
    return res.json({ user: null });
  }
  res.json({ user: req.session.user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email/username or password" });
  }

  try {
    // Check by email OR username
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email.trim(), email.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    req.session.user = sessionUserPayload(user);

    await logAction(user.id, "LOGIN");

    let redirect = "/dashboard";
    if (req.session.user.must_change_password) {
      redirect = "/change-password";
    } else if (
      req.session.user.group_id == null ||
      req.session.user.group_id === ""
    ) {
      redirect = "/select-group";
    }

    const { password: _pwd, ...safeUser } = user;
    safeUser.must_change_password = !!user.must_change_password;
    safeUser.first_login = !!user.first_login;
    safeUser.name = `${user.first_name} ${user.last_name}`;

    res.json({
      message: "Login success",
      user: safeUser,
      redirect,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.logout = (req, res) => {
  const userId = req.session.user?.id;
  req.session.destroy(async (err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    if (userId) await logAction(userId, "LOGOUT");
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All password fields are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "New password must be at least 8 characters",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    if (!bcrypt.compareSync(oldPassword, rows[0].password)) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);

    await db.query(
      `UPDATE users SET password = ?, must_change_password = 0, first_login = 0 WHERE id = ?`,
      [hashed, userId]
    );

    req.session.user.must_change_password = false;
    req.session.user.first_login = false;

    await logAction(userId, "PASSWORD_CHANGED", "First login / forced change completed");

    let redirect = "/dashboard";
    // Only force group selection for Data Cleansing staff
    if (
      req.session.user.role === "Data Cleansing" &&
      (req.session.user.group_id == null || req.session.user.group_id === "")
    ) {
      redirect = "/select-group";
    }

    res.json({ message: "Password updated", redirect });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.selectGroup = async (req, res) => {
  if (req.session.user.must_change_password) {
    return res.status(403).json({ message: "Change your password first" });
  }

  const group_id = normalizeGroupIdParam(req.body.group_id);
  const userId = req.session.user.id;

  if (group_id == null) {
    return res.status(400).json({ message: "Invalid group selection" });
  }

  try {
    await db.query("UPDATE users SET group_id=? WHERE id=?", [group_id, userId]);
    req.session.user.group_id = group_id;

    await logAction(userId, "SELECT GROUP", `Group ${group_id}`);

    res.json({ success: true, redirect: "/dashboard" });
  } catch (err) {
    console.error("Select group error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
