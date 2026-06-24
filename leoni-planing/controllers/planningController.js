const db = require("../config/db");
const { logAction } = require("../utils/logger");

function calculateHomeOfficeDays(year, month, group) {
  const days = [];
  const totalDays = new Date(year, month, 0).getDate();
  
  // Find all Fridays in the month to index them for the quinzaine (alternate weeks)
  const fridays = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    if (dateObj.getDay() === 5) fridays.push(d);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    if (group === 1 || String(group).toUpperCase() === "A") {
      // Group A: Wednesdays & Thursdays every week
      if (dayOfWeek === 3 || dayOfWeek === 4) {
        days.push({ date: dateStr, status: "remote" });
      }
      // Group A: Fridays on weeks 1, 3, and 5
      if (dayOfWeek === 5) {
        const fridayIndex = fridays.indexOf(d) + 1;
        if (fridayIndex === 1 || fridayIndex === 3 || fridayIndex === 5) {
          days.push({ date: dateStr, status: "remote" });
        }
      }
    } else if (group === 2 || String(group).toUpperCase() === "B") {
      // Group B: Mondays & Tuesdays every week
      if (dayOfWeek === 1 || dayOfWeek === 2) {
        days.push({ date: dateStr, status: "remote" });
      }
      // Group B: Fridays on weeks 2 and 4
      if (dayOfWeek === 5) {
        const fridayIndex = fridays.indexOf(d) + 1;
        if (fridayIndex === 2 || fridayIndex === 4) {
          days.push({ date: dateStr, status: "remote" });
        }
      }
    }
  }
  return days;
}

function normalizeGroupIdParam(groupId) {
  if (groupId == null || groupId === "") return null;
  const g = String(groupId).toUpperCase();
  if (g === "A") return 1;
  if (g === "B") return 2;
  const num = parseInt(groupId, 10);
  return Number.isNaN(num) ? null : num;
}

exports.generatePlanning = async (req, res) => {
  const { user_id, month } = req.body;
  const loggedUser = req.session.user;

  // Set target user ID
  const targetUserId = user_id || loggedUser.id;

  // Access Control: Employees can only generate planning for themselves
  if (loggedUser.role !== "Team Leader" && String(targetUserId) !== String(loggedUser.id)) {
    return res.status(403).json({ message: "Forbidden: You cannot generate planning for other users" });
  }

  // Validate month format (YYYY-MM)
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "Invalid month format. Expected YYYY-MM" });
  }

  try {
    // Get target user details
    const [userRows] = await db.query("SELECT group_id, role, first_name, last_name FROM users WHERE id = ?", [targetUserId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userGroup = userRows[0].group_id;
    if (userGroup == null) {
      return res.status(400).json({ message: "User has not selected a Home Office group" });
    }

    const [year, monthNum] = month.split("-").map(Number);
    const planningDays = calculateHomeOfficeDays(year, monthNum, userGroup);

    // Make generation idempotent: clear previous entries for this user and month
    await db.query("DELETE FROM planning WHERE user_id = ? AND month_key = ?", [targetUserId, month]);

    // Insert generated days
    for (const day of planningDays) {
      await db.query(
        "INSERT INTO planning (user_id, date, status, month_key, work_hour) VALUES (?, ?, ?, ?, 8)",
        [targetUserId, day.date, day.status, month]
      );
    }

    await logAction(
      loggedUser.id,
      "GENERATE PLANNING",
      `Generated ${planningDays.length} days for user ID ${targetUserId} (${month})`
    );

    res.json({ success: true, message: `Generated ${planningDays.length} planning entries`, planning: planningDays });
  } catch (err) {
    console.error("Generate planning error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPlanning = async (req, res) => {
  const { month, group_id, name } = req.query;
  const loggedUser = req.session.user;
  const conditions = [];
  const params = [];

  // Security check: Data Cleansing employees can only view their own planning
  if (loggedUser.role !== "Team Leader") {
    conditions.push("planning.user_id = ?");
    params.push(loggedUser.id);
  } else {
    // Team Leader filters
    if (name && String(name).trim()) {
      conditions.push("CONCAT(users.first_name, ' ', users.last_name) LIKE ?");
      params.push(`%${String(name).trim()}%`);
    }
  }

  if (month) {
    conditions.push("planning.month_key = ?");
    params.push(String(month).slice(0, 7));
  }

  const normalizedGroup = normalizeGroupIdParam(group_id);
  if (normalizedGroup != null) {
    conditions.push("users.group_id = ?");
    params.push(normalizedGroup);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [results] = await db.query(
      `SELECT planning.id, planning.user_id, planning.date, planning.status,
              planning.month_key, CONCAT(users.first_name, ' ', users.last_name) AS user_name, users.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       ${whereClause}
       ORDER BY users.first_name, users.last_name, planning.date`,
      params
    );
    res.json(results);
  } catch (err) {
    console.error("Get planning error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPlanningByUser = async (req, res) => {
  const targetUserId = req.params.user_id;
  const loggedUser = req.session.user;

  // Security check: Data Cleansing employees can only view their own planning
  if (loggedUser.role !== "Team Leader" && String(targetUserId) !== String(loggedUser.id)) {
    return res.status(403).json({ message: "Access forbidden: cannot view other users' planning" });
  }

  try {
    const [results] = await db.query(
      `SELECT planning.*, CONCAT(users.first_name, ' ', users.last_name) AS name 
       FROM planning 
       JOIN users ON users.id = planning.user_id
       WHERE planning.user_id = ?
       ORDER BY planning.date`,
      [targetUserId]
    );
    res.json(results);
  } catch (err) {
    console.error("Get planning by user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllPlanning = async (req, res) => {
  const loggedUser = req.session.user;

  try {
    const conditions = [];
    const params = [];
    if (loggedUser.role !== "Team Leader") {
      conditions.push("planning.user_id = ?");
      params.push(loggedUser.id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [results] = await db.query(
      `SELECT planning.id, planning.user_id, planning.date, planning.status,
              planning.month_key, CONCAT(users.first_name, ' ', users.last_name) AS user_name, users.group_id
       FROM planning
       JOIN users ON users.id = planning.user_id
       ${whereClause}
       ORDER BY planning.id DESC`,
      params
    );
    res.json(results);
  } catch (err) {
    console.error("Get all planning error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
