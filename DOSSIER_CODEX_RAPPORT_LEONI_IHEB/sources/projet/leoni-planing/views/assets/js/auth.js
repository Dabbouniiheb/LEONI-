/**
 * LEONI Frontend Authentication Module
 *
 * Manages session state, access control, and permissions on the client side.
 * First-login onboarding requires only the mandatory password change.
 */
const LeoniAuth = (() => {
  let cachedUser = null;
  const passwordChangeRequiredMessage =
    "You must change your temporary password before accessing the application.";

  function requiresPasswordChange(user = cachedUser) {
    return !!(user && (user.first_login || user.must_change_password));
  }

  async function refreshSession() {
    try {
      const data = await LeoniAPI.getSession();
      cachedUser = data.user || null;
      return cachedUser;
    } catch {
      cachedUser = null;
      return null;
    }
  }

  function getUser() {
    return cachedUser;
  }

  function setUser(user) {
    cachedUser = user || null;
  }

  async function logout() {
    try {
      await LeoniAPI.logout();
    } catch {
      // still redirect
    }
    cachedUser = null;
    window.location.href = "/login";
  }

  /**
   * Check if the current user has a specific permission.
   * Permissions are sent from the backend via the session endpoint.
   */
  function hasPermission(permission) {
    if (!cachedUser || !cachedUser.permissions) return false;
    return cachedUser.permissions.includes(permission);
  }

  async function ensureAccess(options = {}) {
    const { allowPasswordChange = false } = options;

    const user = await refreshSession();
    if (!user) {
      window.location.href = "/login";
      return false;
    }

    if (requiresPasswordChange(user) && !allowPasswordChange) {
      window.location.href = "/change-password?reason=password-required";
      return false;
    }

    return true;
  }

  async function redirectIfAuthenticated() {
    const user = await refreshSession();
    if (!user) return false;

    if (requiresPasswordChange(user)) {
      window.location.href = "/change-password?reason=password-required";
      return true;
    }
    window.location.href = "/dashboard";
    return true;
  }

  function initials(name) {
    if (!name) return "L";
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }

  return {
    getUser,
    setUser,
    refreshSession,
    logout,
    hasPermission,
    ensureAccess,
    redirectIfAuthenticated,
    requiresPasswordChange,
    passwordChangeRequiredMessage,
    initials,
  };
})();
