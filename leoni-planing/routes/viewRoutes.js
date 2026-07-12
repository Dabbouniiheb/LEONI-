const express = require("express");
const path = require("path");
const { auth, requireGroup, requirePermission } = require("../middlewares/auth");
const { ROLES } = require("../config/constants");
const { PERMISSIONS } = require("../config/permissions");

const router = express.Router();
const viewsPath = path.join(__dirname, "..", "views");

router.get("/", (req, res) => {
  res.redirect("/login");
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    if (req.session.user.first_login || req.session.user.must_change_password) {
      return res.redirect("/change-password?reason=password-required");
    }
    if (
      req.session.user.role === ROLES.DATA_CLEANSING &&
      (req.session.user.group_id == null || req.session.user.group_id === "")
    ) {
      return res.redirect("/select-group");
    }
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(viewsPath, "login.html"));
});

router.get("/change-password", auth, (req, res) => {
  res.sendFile(path.join(viewsPath, "change-password.html"));
});

router.get("/select-group", auth, (req, res) => {
  if (req.session.user.first_login || req.session.user.must_change_password) {
    return res.redirect("/change-password?reason=password-required");
  }
  if (req.session.user.group_id != null && req.session.user.group_id !== "") {
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(viewsPath, "select-group.html"));
});

// Protected pages with permission-based access control
router.get("/dashboard", auth, requireGroup, (req, res) => {
  res.sendFile(path.join(viewsPath, "dashboard.html"));
});

router.get(
  "/users-page",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.USERS_READ),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "users.html"));
  }
);

router.get("/planning-page", auth, requireGroup, (req, res) => {
  res.sendFile(path.join(viewsPath, "planning.html"));
});

router.get(
  "/calendar-page",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.PLANNING_READ_OWN),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "calendar.html"));
  }
);

router.get(
  "/leave-requests-page",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_READ_OWN),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "leave-requests.html"));
  }
);

router.get(
  "/export-page",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.EXPORT_CSV),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "export.html"));
  }
);

router.get(
  "/logs-page",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.AUDIT_READ),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "logs.html"));
  }
);

module.exports = router;
