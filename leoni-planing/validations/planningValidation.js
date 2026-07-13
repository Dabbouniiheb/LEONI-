const { body, query } = require("express-validator");

exports.generatePlanningValidation = [
  body("month")
    .notEmpty().withMessage("Month is required")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage("Invalid month format. Expected YYYY-MM"),
  body("user_id")
    .optional({ checkFalsy: true })
    .isInt().withMessage("User ID must be an integer")
];

exports.getPlanningValidation = [
  query("month")
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage("Invalid month format. Expected YYYY-MM"),
  query("group_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 2 }).withMessage("Group ID must be 1 or 2"),
  query("name")
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 100 })
];
