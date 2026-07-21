const WorkSessionService = require("../services/WorkSessionService");
const asyncHandler = require("../utils/asyncHandler");

exports.autoStartSession = asyncHandler(async (req, res) => {
  const result = await WorkSessionService.autoStartSession({
    requester: req.session.user,
    planningId: req.body.planning_id,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: result.tracking_available
      ? "Remote work tracking active"
      : "Remote work tracking is not available today",
    ...result,
  });
});

exports.heartbeat = asyncHandler(async (req, res) => {
  const result = await WorkSessionService.heartbeat({
    userId: req.session.user.id,
    sessionId: req.body.session_id,
    isActive: req.body.is_active,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: "Heartbeat received",
    ...result,
  });
});

exports.pauseSession = asyncHandler(async (req, res) => {
  const result = await WorkSessionService.pauseSession({
    userId: req.session.user.id,
    sessionId: req.body.session_id,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: "Work session paused",
    ...result,
  });
});

exports.endSession = asyncHandler(async (req, res) => {
  const result = await WorkSessionService.endSession({
    userId: req.session.user.id,
    sessionId: req.body.session_id,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: "Work session ended",
    ...result,
  });
});

exports.getMine = asyncHandler(async (req, res) => {
  const summary = await WorkSessionService.getMyDailySummary({
    userId: req.session.user.id,
    date: req.query.date,
  });

  res.json({
    success: true,
    ...summary,
  });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await WorkSessionService.getMonthlySummary({
    requester: req.session.user,
    month: req.query.month,
    filters: {
      user_id: req.query.user_id,
      group_id: req.query.group_id,
    },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    ...summary,
  });
});
