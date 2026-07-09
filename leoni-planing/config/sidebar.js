/**
 * Sidebar navigation configuration.
 *
 * Each menu item declares the permission required to see it.
 * The layout renderer filters items dynamically based on the user's role.
 * This is NOT the only layer of protection — backend routes also enforce permissions.
 */

const { PERMISSIONS } = require("./permissions");

const SIDEBAR_ITEMS = [
  {
    id: "dashboard",
    href: "/dashboard",
    icon: "fa-gauge-high",
    label: "Dashboard",
    permission: PERMISSIONS.DASHBOARD_READ,
  },
  {
    id: "users",
    href: "/users-page",
    icon: "fa-users",
    label: "Users",
    permission: PERMISSIONS.USERS_READ,
  },
  {
    id: "planning",
    href: "/planning-page",
    icon: "fa-calendar-days",
    label: "Planning",
    permission: PERMISSIONS.PLANNING_READ_OWN,
  },
  {
    id: "calendar",
    href: "/calendar-page",
    icon: "fa-calendar-week",
    label: "Calendar",
    permission: PERMISSIONS.PLANNING_READ_OWN,
  },
  {
    id: "leave-requests",
    href: "/leave-requests-page",
    icon: "fa-calendar-plus",
    label: "Demande de congé",
    permission: PERMISSIONS.LEAVE_REQUESTS_READ_OWN,
  },
  {
    id: "export",
    href: "/export-page",
    icon: "fa-file-export",
    label: "Export",
    permission: PERMISSIONS.EXPORT_CSV,
  },
  {
    id: "logs",
    href: "/logs-page",
    icon: "fa-clipboard-list",
    label: "Audit Logs",
    permission: PERMISSIONS.AUDIT_READ,
  },
  {
    id: "change-password",
    href: "/change-password",
    icon: "fa-key",
    label: "Change Password",
    permission: null, // Available to all authenticated users
  },
];

module.exports = { SIDEBAR_ITEMS };
