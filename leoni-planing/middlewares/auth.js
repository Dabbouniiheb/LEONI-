/**
 * RBAC Middleware — Permission-Based Access Control.
 *
 * Uses the permission matrix from config/permissions.js.
 * Never hardcodes role names in route files — always checks permissions.
 *
 * Middleware chain for protected routes:
 *   auth → requireGroup → requirePermission("users.read")
 */

const { hasPermission, getPermissionsForRole } = require("../config/permissions");
const { ROLES } = require("../config/constants");
const { wantsJson } = require("../utils/helpers");
const logger = require("../utils/appLogger");

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
 * Verify the user has completed the onboarding flow:
 *  1. Password changed (if must_change_password)
 *  2. Group selected (if Data Cleansing role)
 */
function requireGroup(req, res, next) {
  if (!req.session.user) {
    if (wantsJson(req)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    return res.redirect("/login");
  }

  // Step 1: Force password change
  if (req.session.user.first_login || req.session.user.must_change_password) {
    if (wantsJson(req)) {
      return res.status(403).json({
        success: false,
        message: "Password change required",
        redirect: "/change-password",
      });
    }
    return res.redirect("/change-password");
  }

  // Step 2: Force group selection (Data Cleansing only — Team Leaders don't need a group)
  if (
    req.session.user.role === ROLES.DATA_CLEANSING &&
    (req.session.user.group_id == null || req.session.user.group_id === "")
  ) {
    if (wantsJson(req)) {
      return res.status(403).json({
        success: false,
        message: "Veuillez sélectionner votre groupe Home Office",
        redirect: "/select-group",
      });
    }
    return res.redirect("/select-group");
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
  requireGroup,
  requirePermission,
  wantsJson,
};
