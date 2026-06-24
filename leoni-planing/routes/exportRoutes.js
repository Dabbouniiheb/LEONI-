const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { auth, requireRole, requireGroup } = require("../middlewares/auth");

router.get(
  "/export-planning",
  auth,
  requireGroup,
  requireRole(["Team Leader"]),
  exportController.exportCsv
);

router.get(
  "/export-xlsx",
  auth,
  requireGroup,
  requireRole(["Team Leader"]),
  exportController.exportXlsx
);

module.exports = router;
