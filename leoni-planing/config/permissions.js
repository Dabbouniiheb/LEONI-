/**
 * Permission-Based Access Control Configuration.
 *
 * Permissions are atomic actions (e.g. "users.read").
 * Roles are collections of permissions.
 * This approach avoids hardcoding role checks throughout the codebase.
 */

const { ROLES } = require("./constants");

// ── Permission Definitions ───────────────────────────────────────────
const PERMISSIONS = Object.freeze({
  // Dashboard
  DASHBOARD_READ: "dashboard.read",
  DASHBOARD_STATISTICS: "dashboard.statistics",

  // Users
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Planning
  PLANNING_READ_OWN: "planning.read.own",
  PLANNING_READ_ALL: "planning.read.all",
  PLANNING_GENERATE_OWN: "planning.generate.own",
  PLANNING_GENERATE_ALL: "planning.generate.all",

  // Leave Requests
  LEAVE_REQUESTS_READ_OWN: "leave_requests.read.own",
  LEAVE_REQUESTS_MANAGE: "leave_requests.manage",

  // Export
  EXPORT_CSV: "export.csv",
  EXPORT_XLSX: "export.xlsx",

  // Audit
  AUDIT_READ: "audit.read",

  // Settings
  SETTINGS_MANAGE: "settings.manage",
});

// ── Role → Permission Mapping ────────────────────────────────────────
const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.TEAM_LEADER]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_STATISTICS,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.PLANNING_READ_OWN,
    PERMISSIONS.PLANNING_READ_ALL,
    PERMISSIONS.PLANNING_GENERATE_OWN,
    PERMISSIONS.PLANNING_GENERATE_ALL,
    PERMISSIONS.LEAVE_REQUESTS_READ_OWN,
    PERMISSIONS.LEAVE_REQUESTS_MANAGE,
    PERMISSIONS.EXPORT_CSV,
    PERMISSIONS.EXPORT_XLSX,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  [ROLES.DATA_CLEANSING]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.PLANNING_READ_OWN,
    PERMISSIONS.PLANNING_GENERATE_OWN,
    PERMISSIONS.LEAVE_REQUESTS_READ_OWN,
  ],
});

/**
 * Check whether a given role possesses a specific permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Return all permissions granted to a role.
 * @param {string} role
 * @returns {string[]}
 */
function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissionsForRole,
};
