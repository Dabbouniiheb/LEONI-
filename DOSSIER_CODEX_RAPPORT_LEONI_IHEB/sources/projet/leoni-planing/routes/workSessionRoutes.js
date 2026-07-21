/**
 * Work Session Routes
 *
 * Mounted at: /api/work-sessions
 */

const express = require("express");
const router = express.Router();
const workSessionController = require("../controllers/workSessionController");
const { auth, requireOnboardingComplete, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");
const validate = require("../middlewares/validate");
const {
  autoStartSessionValidation,
  heartbeatValidation,
  sessionIdValidation,
  mineValidation,
  summaryValidation,
} = require("../validations/workSessionValidation");

router.post(
  "/auto-start",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_READ_OWN),
  autoStartSessionValidation,
  validate,
  workSessionController.autoStartSession
);

router.post(
  "/heartbeat",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_READ_OWN),
  heartbeatValidation,
  validate,
  workSessionController.heartbeat
);

router.post(
  "/pause",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_READ_OWN),
  sessionIdValidation,
  validate,
  workSessionController.pauseSession
);

router.post(
  "/end",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_READ_OWN),
  sessionIdValidation,
  validate,
  workSessionController.endSession
);

router.get(
  "/mine",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_READ_OWN),
  mineValidation,
  validate,
  workSessionController.getMine
);

router.get(
  "/summary",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.WORK_SESSIONS_READ_SUMMARY),
  summaryValidation,
  validate,
  workSessionController.getSummary
);

module.exports = router;
