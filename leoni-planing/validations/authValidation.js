const { body } = require("express-validator");

exports.loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email address")
    .isLength({ max: 255 }).withMessage("Email must not exceed 255 characters")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty().withMessage("Password is required")
    .isLength({ max: 200 }).withMessage("Password must not exceed 200 characters")
];

exports.changePasswordValidation = [
  body("oldPassword")
    .notEmpty().withMessage("Current password is required")
    .isLength({ max: 200 }).withMessage("Current password must not exceed 200 characters"),
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8, max: 200 }).withMessage("New password must be between 8 and 200 characters"),
  body("confirmPassword")
    .notEmpty().withMessage("Please confirm new password")
    .isLength({ max: 200 })
];
