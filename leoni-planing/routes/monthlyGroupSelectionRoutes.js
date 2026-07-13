const express = require("express");
const router = express.Router();
const monthlyGroupSelectionController = require("../controllers/monthlyGroupSelectionController");
const { auth, requireOnboardingComplete, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");
const validate = require("../middlewares/validate");
const {
  getMonthlySelectionValidation,
  saveMonthlySelectionValidation,
} = require("../validations/monthlyGroupSelectionValidation");

router.get(
  "/mine",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.MONTHLY_GROUP_SELECTION_READ_OWN),
  getMonthlySelectionValidation,
  validate,
  monthlyGroupSelectionController.getMine
);

router.put(
  "/mine",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.MONTHLY_GROUP_SELECTION_WRITE_OWN),
  saveMonthlySelectionValidation,
  validate,
  monthlyGroupSelectionController.saveMine
);

router.get(
  "/",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.MONTHLY_GROUP_SELECTION_READ_ALL),
  getMonthlySelectionValidation,
  validate,
  monthlyGroupSelectionController.getMonthStatus
);

module.exports = router;
