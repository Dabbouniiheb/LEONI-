/**
 * Export Routes
 *
 * Mounted at: /api/export
 */

const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { auth, requireGroup, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");

router.get(
  "/csv",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.EXPORT_CSV),
  exportController.exportCsv
);

router.get(
  "/xlsx",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.EXPORT_XLSX),
  exportController.exportXlsx
);

module.exports = router;
