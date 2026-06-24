const db = require("../config/db");

exports.getStats = async (req, res) => {
  const today = new Date();
  let defaultMonthKey = today.toISOString().slice(0, 7); // YYYY-MM
  
  // If today is 25th or later, default validation stats to the next month
  if (today.getDate() >= 25) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    defaultMonthKey = nextMonth.toISOString().slice(0, 7);
  }

  const monthKey = req.query.month || defaultMonthKey;

  try {
    const [[usersResult]] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [[planningResult]] = await db.query("SELECT COUNT(*) AS count FROM planning");
    
    const [[groupAResult]] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE group_id = 1"
    );
    const [[groupBResult]] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE group_id = 2"
    );

    const [[employeesCountResult]] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'Data Cleansing'"
    );

    const [[completedCountResult]] = await db.query(
      `SELECT COUNT(DISTINCT p.user_id) AS count 
       FROM planning p 
       JOIN users u ON u.id = p.user_id 
       WHERE p.month_key = ? AND u.role = 'Data Cleansing'`,
      [monthKey]
    );

    const totalUsers = usersResult.count;
    const totalPlanning = planningResult.count;
    const groupA = groupAResult.count;
    const groupB = groupBResult.count;
    const totalEmployees = employeesCountResult.count;
    const planningCompleted = completedCountResult.count;
    
    const validationRate = totalEmployees > 0 
      ? Math.round((planningCompleted / totalEmployees) * 100) 
      : 0;

    res.json({
      totalUsers,
      totalPlanning,
      groupA,
      groupB,
      planningCompleted,
      validationRate,
      monthKey,
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
