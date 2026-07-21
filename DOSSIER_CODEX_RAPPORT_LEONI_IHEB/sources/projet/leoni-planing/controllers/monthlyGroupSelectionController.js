const MonthlyGroupSelectionService = require("../services/MonthlyGroupSelectionService");
const asyncHandler = require("../utils/asyncHandler");

exports.getMine = asyncHandler(async (req, res) => {
  const result = await MonthlyGroupSelectionService.getMine(
    req.session.user.id,
    req.query.month
  );
  res.json({ success: true, ...result });
});

exports.saveMine = asyncHandler(async (req, res) => {
  const result = await MonthlyGroupSelectionService.saveMine(
    req.session.user.id,
    req.body.month,
    req.body.group_id,
    req.ip
  );
  res.json({
    success: true,
    message: result.changed
      ? `Group ${result.selection.group_code} saved for ${result.month}.`
      : `Group ${result.selection.group_code} is already selected for ${result.month}.`,
    ...result,
  });
});

exports.getMonthStatus = asyncHandler(async (req, res) => {
  const result = await MonthlyGroupSelectionService.getMonthStatus(req.query.month);
  res.json({ success: true, ...result });
});
