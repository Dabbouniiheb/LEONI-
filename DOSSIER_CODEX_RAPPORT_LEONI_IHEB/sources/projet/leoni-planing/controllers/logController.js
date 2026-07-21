const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

exports.getLogs = asyncHandler(async (req, res) => {
  const [results] = await db.query(
    `SELECT audit_logs.id, audit_logs.user_id, 
            CONCAT(users.first_name, ' ', users.last_name) AS user_name,
            audit_logs.action, audit_logs.created_at, audit_logs.details
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ORDER BY audit_logs.created_at DESC
     LIMIT 100`
  );
  res.json(results);
});
