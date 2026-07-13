const express = require("express");
const path = require("path");
const { auth, requireOnboardingComplete, requirePermission } = require("../middlewares/auth");
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
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(viewsPath, "login.html"));
});

router.get("/change-password", auth, (req, res) => {
  res.sendFile(path.join(viewsPath, "change-password.html"));
});

// Protected pages with permission-based access control
router.get("/dashboard", auth, requireOnboardingComplete, (req, res) => {
  res.sendFile(path.join(viewsPath, "dashboard.html"));
});

router.get(
  "/users-page",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.USERS_READ),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "users.html"));
  }
);

router.get("/planning-page", auth, requireOnboardingComplete, (req, res) => {
  res.sendFile(path.join(viewsPath, "planning.html"));
});

router.get(
  "/calendar-page",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.PLANNING_READ_OWN),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "calendar.html"));
  }
);

router.get(
  "/leave-requests-page",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_READ_OWN),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "leave-requests.html"));
  }
);

router.get(
  "/export-page",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.EXPORT_CSV),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "export.html"));
  }
);

router.get(
  "/logs-page",
  auth,
  requireOnboardingComplete,
  requirePermission(PERMISSIONS.AUDIT_READ),
  (req, res) => {
    res.sendFile(path.join(viewsPath, "logs.html"));
  }
);

module.exports = router;
