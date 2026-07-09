/**
 * Planning Routes
 *
 * Mounted at: /api/planning
 */

const express = require("express");
const router = express.Router();
const planningController = require("../controllers/planningController");
const { auth, requireGroup } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { generatePlanningValidation, getPlanningValidation } = require("../validations/planningValidation");

router.post("/generate", auth, requireGroup, generatePlanningValidation, validate, planningController.generatePlanning);
router.get("/calendar", auth, requireGroup, planningController.getPlanningCalendars);
router.get("/", auth, requireGroup, getPlanningValidation, validate, planningController.getPlanning);
router.get("/all", auth, requireGroup, planningController.getAllPlanning);
router.get("/:user_id", auth, requireGroup, planningController.getPlanningByUser);

module.exports = router;
