/**
 * RBAC Middleware — Permission-Based Access Control.
 *
 * Uses the permission matrix from config/permissions.js.
 * Never hardcodes role names in route files — always checks permissions.
 *
 * Middleware chain for protected routes:
 *   auth → requireOnboardingComplete → requirePermission("users.read")
 */

const { hasPermission } = require("../config/permissions");
const { wantsJson } = require("../utils/helpers");
const logger = require("../utils/appLogger");

const PASSWORD_CHANGE_REQUIRED_MESSAGE =
  "You must change your temporary password before accessing the application.";
const PASSWORD_CHANGE_PATH = "/change-password?reason=password-required";

/**
 * Verify the user is authenticated (has a session).
 */
function auth(req, res, next) {
  if (!req.session.user) {
    if (wantsJson(req)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    return res.redirect("/login");
  }
  next();
}

/**
 * Verify the user has completed the mandatory password-change step.
 */
function requireOnboardingComplete(req, res, next) {
  if (!req.session.user) {
    if (wantsJson(req)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    return res.redirect("/login");
  }

  // Force password change before allowing access to the application.
  if (req.session.user.first_login || req.session.user.must_change_password) {
    if (wantsJson(req)) {
      return res.status(403).json({
        success: false,
        message: PASSWORD_CHANGE_REQUIRED_MESSAGE,
        redirect: PASSWORD_CHANGE_PATH,
      });
    }
    return res.redirect(PASSWORD_CHANGE_PATH);
  }

  next();
}

/**
 * Permission-based authorization middleware factory.
 * Usage: requirePermission(PERMISSIONS.USERS_READ)
 *
 * @param {string} permission — A permission key from config/permissions.js
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.session.user) {
      if (wantsJson(req)) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      return res.redirect("/login");
    }

    const userRole = req.session.user.role;
    if (!hasPermission(userRole, permission)) {
      logger.warn("Permission denied", {
        userId: req.session.user.id,
        role: userRole,
        required: permission,
        path: req.originalUrl,
      });

      if (wantsJson(req)) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: insufficient permissions",
        });
      }
      // For page requests, serve a 403 page
      return res.status(403).sendFile(
        require("path").join(__dirname, "..", "views", "403.html")
      );
    }

    next();
  };
}

module.exports = {
  auth,
  requireOnboardingComplete,
  requirePermission,
  wantsJson,
};
