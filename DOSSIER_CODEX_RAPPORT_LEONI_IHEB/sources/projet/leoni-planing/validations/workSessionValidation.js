const { body, query } = require("express-validator");

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidMonthKey(value) {
  if (!/^\d{4}-\d{2}$/.test(String(value || ""))) return false;
  const month = Number(String(value).slice(5, 7));
  return month >= 1 && month <= 12;
}

exports.autoStartSessionValidation = [
  body("planning_id")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage("Planning ID must be a positive integer"),
];

exports.heartbeatValidation = [
  body("session_id")
    .notEmpty().withMessage("Session ID is required")
    .isInt({ min: 1 }).withMessage("Session ID must be a positive integer"),
  body("is_active")
    .exists({ values: "undefined" }).withMessage("Active state is required")
    .isBoolean().withMessage("Active state must be boolean")
    .toBoolean(),
];

exports.sessionIdValidation = [
  body("session_id")
    .notEmpty().withMessage("Session ID is required")
    .isInt({ min: 1 }).withMessage("Session ID must be a positive integer"),
];

exports.mineValidation = [
  query("date")
    .optional({ checkFalsy: true })
    .custom(isValidDateString).withMessage("Date must use YYYY-MM-DD format"),
];

exports.summaryValidation = [
  query("month")
    .notEmpty().withMessage("Month is required")
    .custom(isValidMonthKey).withMessage("Invalid month format. Expected YYYY-MM"),
  query("user_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("User ID must be a positive integer"),
  query("group_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 2 }).withMessage("Group ID must be 1 or 2"),
];
