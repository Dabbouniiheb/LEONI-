/**
 * Authentication Routes
 *
 * Mounted at: /api/auth
 * Paths are relative to the mount point.
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { loginValidation, changePasswordValidation } = require("../validations/authValidation");

router.get("/session", authController.getSession);
router.post("/login", loginValidation, validate, authController.login);
router.post("/logout", authController.logout);
router.post("/change-password", auth, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
