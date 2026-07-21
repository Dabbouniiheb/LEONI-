/**
 * User Management Routes
 *
 * Mounted at: /api/users
 * All routes require authentication + completed password onboarding + permission.
 */

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, requireOnboardingComplete, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");
const validate = require("../middlewares/validate");
const { createUserValidation, updateUserValidation, userIdValidation } = require("../validations/userValidation");

router.get(
  "/",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.USERS_READ),
  userController.getUsers
);

router.post(
  "/",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.USERS_CREATE),
  createUserValidation,
  validate,
  userController.createUser
);

router.put(
  "/:id",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.USERS_UPDATE),
  userIdValidation,
  updateUserValidation,
  validate,
  userController.updateUser
);

router.delete(
  "/:id",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.USERS_DELETE),
  userIdValidation,
  validate,
  userController.deleteUser
);

module.exports = router;
