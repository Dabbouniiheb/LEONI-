const express = require("express");
const router = express.Router();
const planningController = require("../controllers/planningController");
const { auth, requireGroup } = require("../middlewares/auth");

router.post("/generate-planning", auth, requireGroup, planningController.generatePlanning);
router.get("/planning", auth, requireGroup, planningController.getPlanning);
router.get("/planning/:user_id", auth, requireGroup, planningController.getPlanningByUser);
router.get("/all-planning", auth, requireGroup, planningController.getAllPlanning);

module.exports = router;
