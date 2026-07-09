/**
 * Planning Controller
 *
 * Changes:
 * - Refactored to Enterprise Architecture: Controller -> Service -> Model
 * - Removed all business logic and SQL queries
 * - Uses PlanningService for all operations
 * - Implemented asyncHandler
 */

const PlanningService = require("../services/PlanningService");
const { ROLES, AUDIT_ACTIONS } = require("../config/constants");
const { logAction } = require("../utils/logger");
const { normalizeGroupId } = require("../utils/helpers");
const asyncHandler = require("../utils/asyncHandler");

exports.generatePlanning = asyncHandler(async (req, res) => {
  const { user_id, month } = req.body;
  const loggedUser = req.session.user;

  const targetUserId = user_id || loggedUser.id;

  // Access Control: Data Cleansing can only generate for themselves
  if (loggedUser.role !== ROLES.TEAM_LEADER && String(targetUserId) !== String(loggedUser.id)) {
    return res.status(403).json({ success: false, message: "Forbidden: You cannot generate planning for other users" });
  }

  try {
    const planningDays = await PlanningService.generatePlanning(targetUserId, month);

    await logAction(
      loggedUser.id,
      AUDIT_ACTIONS.GENERATE_PLANNING,
      `Generated ${planningDays.length} days for user ID ${targetUserId} (${month})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Generated ${planningDays.length} planning entries`,
      planning: planningDays,
    });
  } catch (err) {
    if (err.message === "Invalid month format. Expected YYYY-MM" || err.message === "User has not selected a Home Office group") {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.message === "User not found") {
      return res.status(404).json({ success: false, message: err.message });
    }
    throw err;
  }
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

  try {
    const results = await PlanningService.getPlanningByUser(targetUserId, loggedUser, ROLES);
    res.json(results);
  } catch (err) {
    if (err.message === "Access forbidden") {
      return res.status(403).json({ success: false, message: "Access forbidden: cannot view other users' planning" });
    }
    throw err;
  }
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
