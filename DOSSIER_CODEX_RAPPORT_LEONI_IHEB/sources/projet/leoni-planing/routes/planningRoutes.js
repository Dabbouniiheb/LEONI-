/**
 * Planning Routes
 *
 * Mounted at: /api/planning
 */

const express = require("express");
const router = express.Router();
const planningController = require("../controllers/planningController");
const { auth, requireOnboardingComplete, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");
const validate = require("../middlewares/validate");
const { generatePlanningValidation, getPlanningValidation } = require("../validations/planningValidation");

router.get(
  "/generation-window",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_GENERATE_OWN),
  planningController.getGenerationWindow
);
router.post(
  "/generate",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_GENERATE_OWN),
  generatePlanningValidation,
  validate,
  planningController.generatePlanning
);
router.get("/calendar", auth, requireOnboardingComplete, planningController.getPlanningCalendars);
router.get("/", auth, requireOnboardingComplete, getPlanningValidation, validate, planningController.getPlanning);
router.get("/all", auth, requireOnboardingComplete, planningController.getAllPlanning);
router.get("/:user_id", auth, requireOnboardingComplete, planningController.getPlanningByUser);

module.exports = router;
