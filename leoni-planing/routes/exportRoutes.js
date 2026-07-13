/**
 * Export Routes
 *
 * Mounted at: /api/export
 */

const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { auth, requireOnboardingComplete, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");

router.get(
  "/csv",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.EXPORT_CSV),
  exportController.exportCsv
);

router.get(
  "/xlsx",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.EXPORT_XLSX),
  exportController.exportXlsx
);

module.exports = router;
