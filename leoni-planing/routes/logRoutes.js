const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const { auth, requireRole, requireGroup } = require("../middlewares/auth");

router.get("/logs", auth, requireGroup, requireRole(["Team Leader"]), logController.getLogs);

module.exports = router;
