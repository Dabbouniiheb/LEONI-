const { body, param } = require("express-validator");
const { LEAVE_TYPES } = require("../config/constants");

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

exports.leaveRequestIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid leave request ID format"),
];

exports.createLeaveRequestValidation = [
  body("start_date")
    .trim()
    .notEmpty().withMessage("Start date is required")
    .custom(isValidDateString).withMessage("Start date must use YYYY-MM-DD format"),
  body("end_date")
    .trim()
    .notEmpty().withMessage("End date is required")
    .custom(isValidDateString).withMessage("End date must use YYYY-MM-DD format")
    .custom((endDate, { req }) => String(req.body.start_date || "") <= String(endDate || ""))
    .withMessage("End date must be after or equal to start date"),
  body("leave_type")
    .trim()
    .notEmpty().withMessage("Leave type is required")
    .isIn(Object.values(LEAVE_TYPES)).withMessage("Invalid leave type"),
  body("reason")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage("Reason must not exceed 500 characters"),
];

exports.reviewLeaveRequestValidation = [
  body("decision_comment")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage("Decision comment must not exceed 500 characters"),
];
