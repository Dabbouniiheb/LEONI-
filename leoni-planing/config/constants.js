/**
 * Application-wide constants.
 * Eliminates magic strings across the entire codebase.
 */

const ROLES = Object.freeze({
  TEAM_LEADER: "Team Leader",
  DATA_CLEANSING: "Data Cleansing",
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

const GROUPS = Object.freeze({
  A: 1,
  B: 2,
});

const GROUP_LABELS = Object.freeze({
  [GROUPS.A]: "Group A",
  [GROUPS.B]: "Group B",
});

const GROUP_VALUES = Object.freeze(Object.values(GROUPS));

const PLANNING_STATUS = Object.freeze({
  ONSITE: "onsite",
  REMOTE: "remote",
});

const VALIDATION_STATUS = Object.freeze({
  VALIDATED: "validated",
  PENDING: "pending",
  EXPIRED: "expired",
});

const AUDIT_ACTIONS = Object.freeze({
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  SELECT_GROUP: "SELECT_GROUP",
  CREATE_USER: "CREATE_USER",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",
  RESTORE_USER: "RESTORE_USER",
  GENERATE_PLANNING: "GENERATE_PLANNING",
  EXPORT_CSV: "EXPORT_CSV",
  EXPORT_XLSX: "EXPORT_XLSX",
});

const VALIDATION_RULES = Object.freeze({
  PASSWORD_MIN_LENGTH: 8,
  MONTH_KEY_REGEX: /^\d{4}-\d{2}$/,
  PLANNING_WINDOW_DAY: 25,
  DEFAULT_WORK_HOUR: 8,
  SESSION_MAX_AGE_MS: 1000 * 60 * 60 * 8, // 8 hours
  BCRYPT_SALT_ROUNDS: 10,
  AUDIT_LOG_LIMIT: 100,
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
});

module.exports = {
  ROLES,
  ROLE_VALUES,
  GROUPS,
  GROUP_LABELS,
  GROUP_VALUES,
  PLANNING_STATUS,
  VALIDATION_STATUS,
  AUDIT_ACTIONS,
  VALIDATION_RULES,
  HTTP_STATUS,
};
