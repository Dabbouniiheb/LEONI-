const { body } = require("express-validator");
const { ROLES } = require("../config/constants");

exports.loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty().withMessage("Password is required")
];

exports.changePasswordValidation = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8, max: 64 }).withMessage("New password must be between 8 and 64 characters"),
  body("confirmPassword")
    .notEmpty().withMessage("Please confirm new password")
];

exports.selectGroupValidation = [
  body("group_id")
    .notEmpty().withMessage("Group ID is required")
    .isInt({ min: 1, max: 2 }).withMessage("Group ID must be 1 (Group A) or 2 (Group B)")
];
