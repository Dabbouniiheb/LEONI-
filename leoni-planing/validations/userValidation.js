const { body, param } = require("express-validator");
const { ROLES } = require("../config/constants");

exports.userIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid User ID format")
];

exports.createUserValidation = [
  body("first_name").trim().notEmpty().withMessage("First name is required").isLength({ max: 50 }).withMessage("Max 50 characters"),
  body("last_name").trim().notEmpty().withMessage("Last name is required").isLength({ max: 50 }).withMessage("Max 50 characters"),
  body("username").trim().notEmpty().withMessage("Username is required").isLength({ max: 50 }).withMessage("Max 50 characters"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required").isLength({ max: 255 }).withMessage("Max 255 characters").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required").isLength({ min: 8, max: 200 }).withMessage("Password must be 8-200 characters"),
  body("matricule").trim().notEmpty().withMessage("Matricule is required").isLength({ max: 50 }),
  body("department").trim().notEmpty().withMessage("Department is required").isLength({ max: 100 }),
  body("role").optional().isIn(Object.values(ROLES)).withMessage("Invalid role"),
];

exports.updateUserValidation = [
  body("first_name").trim().notEmpty().withMessage("First name is required").isLength({ max: 50 }),
  body("last_name").trim().notEmpty().withMessage("Last name is required").isLength({ max: 50 }),
  body("matricule").trim().notEmpty().withMessage("Matricule is required").isLength({ max: 50 }),
  body("department").trim().notEmpty().withMessage("Department is required").isLength({ max: 100 }),
  body("role").notEmpty().withMessage("Role is required").isIn(Object.values(ROLES)).withMessage("Invalid role"),
  body("group_id").optional({ checkFalsy: true }).isInt({ min: 1, max: 2 }).withMessage("Group must be 1 or 2")
];
