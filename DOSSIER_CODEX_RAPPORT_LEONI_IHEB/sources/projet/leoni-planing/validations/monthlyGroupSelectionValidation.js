const { body, query } = require("express-validator");

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

exports.getMonthlySelectionValidation = [
  query("month")
    .notEmpty().withMessage("Month is required")
    .matches(MONTH_PATTERN).withMessage("Invalid month format. Expected YYYY-MM"),
];

exports.saveMonthlySelectionValidation = [
  body("month")
    .notEmpty().withMessage("Month is required")
    .matches(MONTH_PATTERN).withMessage("Invalid month format. Expected YYYY-MM"),
  body("group_id")
    .notEmpty().withMessage("Group is required")
    .isInt({ min: 1, max: 2 }).withMessage("Group must be 1 (Group A) or 2 (Group B)"),
];
