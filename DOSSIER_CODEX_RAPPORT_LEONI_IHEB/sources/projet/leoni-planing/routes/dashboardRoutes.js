/**
 * Dashboard Routes
 *
 * Mounted at: /api/dashboard
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { auth, requireOnboardingComplete } = require("../middlewares/auth");

router.get("/stats", auth, requireOnboardingComplete, dashboardController.getStats);

module.exports = router;
