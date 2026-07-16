/**
 * Dashboard controller for user, monthly-group, and planning statistics.
 */

const db = require("../config/db");
const { ROLES } = require("../config/constants");
const PlanningGenerationWindowService = require("../services/PlanningGenerationWindowService");
const { getTargetMonthContext } = require("../utils/planningGenerationWindow");
const asyncHandler = require("../utils/asyncHandler");

exports.getStats = asyncHandler(async (req, res) => {
  let monthKey = req.query.month;
  if (!monthKey) {
    const generationWindow =
      await PlanningGenerationWindowService.getPlanningGenerationWindow();
    ({ monthKey } = getTargetMonthContext(generationWindow));
  }

  const [userStatsResult, monthlyGroupStatsResult, planningStatsResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS totalUsers, SUM(role = ?) AS totalEmployees
       FROM users
       WHERE is_deleted = 0`,
      [ROLES.DATA_CLEANSING]
    ),
    db.query(
      `SELECT
         SUM(mgs.group_id = 1) AS groupA,
         SUM(mgs.group_id = 2) AS groupB
       FROM monthly_group_selections mgs
       JOIN users u ON u.id = mgs.user_id
       WHERE mgs.month_key = ? AND u.role = ? AND u.is_deleted = 0`,
      [monthKey, ROLES.DATA_CLEANSING]
    ),
    db.query(
      `SELECT
         COUNT(*) AS totalPlanning,
         COUNT(DISTINCT CASE WHEN p.month_key = ? AND u.role = ? THEN p.user_id END) AS planningCompleted
       FROM planning p
       JOIN users u ON u.id = p.user_id
       WHERE u.is_deleted = 0`,
      [monthKey, ROLES.DATA_CLEANSING]
    ),
  ]);

  const userStats = userStatsResult[0][0];
  const monthlyGroupStats = monthlyGroupStatsResult[0][0];
  const planningStats = planningStatsResult[0][0];

  const totalUsers = Number(userStats.totalUsers) || 0;
  const totalEmployees = Number(userStats.totalEmployees) || 0;
  const groupA = Number(monthlyGroupStats.groupA) || 0;
  const groupB = Number(monthlyGroupStats.groupB) || 0;
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
