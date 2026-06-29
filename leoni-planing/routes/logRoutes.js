/**
 * Audit Log Routes
 *
 * Mounted at: /api/logs
 */

const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const { auth, requireGroup, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");

router.get(
  "/",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.AUDIT_READ),
  logController.getLogs
);

module.exports = router;
