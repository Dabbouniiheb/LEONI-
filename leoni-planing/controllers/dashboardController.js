/**
 * Dashboard Controller
 *
 * Changes from original:
 * - Consolidated 6 separate COUNT queries into 2 efficient queries
 * - Filters soft-deleted users
 * - Uses structured logger
 * - Uses asyncHandler
 */

const db = require("../config/db");
const logger = require("../utils/appLogger");
const { ROLES } = require("../config/constants");
const { getTargetMonthKey } = require("../utils/helpers");
const asyncHandler = require("../utils/asyncHandler");

exports.getStats = asyncHandler(async (req, res) => {
  const { monthKey: defaultMonthKey } = getTargetMonthKey();
  const monthKey = req.query.month || defaultMonthKey;

  // Consolidated query 1: All user counts in a single pass
  const [[userStats]] = await db.query(
    `SELECT
       COUNT(*) AS totalUsers,
       SUM(role = ?) AS totalEmployees,
       SUM(group_id = 1) AS groupA,
       SUM(group_id = 2) AS groupB
     FROM users
     WHERE is_deleted = 0`,
    [ROLES.DATA_CLEANSING]
  );

  // Consolidated query 2: Planning stats
  const [[planningStats]] = await db.query(
    `SELECT
       COUNT(*) AS totalPlanning,
       COUNT(DISTINCT CASE WHEN p.month_key = ? AND u.role = ? THEN p.user_id END) AS planningCompleted
     FROM planning p
     JOIN users u ON u.id = p.user_id
     WHERE u.is_deleted = 0`,
    [monthKey, ROLES.DATA_CLEANSING]
  );

  const totalUsers = Number(userStats.totalUsers) || 0;
  const totalEmployees = Number(userStats.totalEmployees) || 0;
  const groupA = Number(userStats.groupA) || 0;
  const groupB = Number(userStats.groupB) || 0;
  const totalPlanning = Number(planningStats.totalPlanning) || 0;
  const planningCompleted = Number(planningStats.planningCompleted) || 0;

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
});
