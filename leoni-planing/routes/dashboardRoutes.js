const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { auth, requireGroup } = require("../middlewares/auth");

router.get("/stats", auth, requireGroup, dashboardController.getStats);

module.exports = router;
