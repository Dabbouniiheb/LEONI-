/**
 * Planning controller delegating business and data operations to PlanningService.
 */

const PlanningService = require("../services/PlanningService");
const { ROLES, AUDIT_ACTIONS } = require("../config/constants");
const { PERMISSIONS, hasPermission } = require("../config/permissions");
const { logAction } = require("../utils/logger");
const { normalizeGroupId } = require("../utils/helpers");
const asyncHandler = require("../utils/asyncHandler");

exports.getGenerationWindow = asyncHandler(async (req, res) => {
  const window = await PlanningService.getPlanningGenerationWindow();
  res.json({ success: true, window });
});

exports.generatePlanning = asyncHandler(async (req, res) => {
  const { user_id, month } = req.body;
  const loggedUser = req.session.user;

  const targetUserId = user_id || loggedUser.id;

  const requiredPermission = String(targetUserId) === String(loggedUser.id)
    ? PERMISSIONS.PLANNING_GENERATE_OWN
    : PERMISSIONS.PLANNING_GENERATE_ALL;

  if (!hasPermission(loggedUser.role, requiredPermission)) {
    return res.status(403).json({ success: false, message: "Forbidden: You cannot generate planning for other users" });
  }

  const result = await PlanningService.generatePlanning(targetUserId, month);
  const { planningDays, generationWindow, groupCode } = result;

  await logAction(
    loggedUser.id,
    AUDIT_ACTIONS.GENERATE_PLANNING,
    `actor_user_id=${loggedUser.id}; target_user_id=${targetUserId}; server_date=${generationWindow.server_date}; timezone=${generationWindow.timezone}; allowed_month=${generationWindow.allowed_month}; group=${groupCode}; generated_rows=${planningDays.length}`,
    req.ip
  );

  res.json({
    success: true,
    message: `Generated ${planningDays.length} planning entries`,
    planning: planningDays,
    window: generationWindow,
  });
});

exports.getPlanning = asyncHandler(async (req, res) => {
  const { month, group_id, name } = req.query;
  const loggedUser = req.session.user;

  const results = await PlanningService.getPlanningByFilters({
    month,
    group_id,
    name,
    loggedUser,
    normalizeGroupId,
    ROLES,
  });

  res.json(results);
});

exports.getPlanningByUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.user_id;
  const loggedUser = req.session.user;

  const results = await PlanningService.getPlanningByUser(targetUserId, loggedUser, ROLES);
  res.json(results);
});

exports.getAllPlanning = asyncHandler(async (req, res) => {
  const loggedUser = req.session.user;
  const results = await PlanningService.getAllPlanning(loggedUser, ROLES);
  res.json(results);
});

exports.getPlanningCalendars = asyncHandler(async (req, res) => {
  const loggedUser = req.session.user;
  const results = await PlanningService.getPlanningCalendars(loggedUser, ROLES);
  res.json(results);
});
