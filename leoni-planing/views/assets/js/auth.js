/**
 * LEONI Frontend Authentication Module
 *
 * Manages session state, access control, and permissions on the client side.
 * Bug fix: Team Leaders no longer get redirected to group selection
 * (they don't need a group — only Data Cleansing users do).
 */
const LeoniAuth = (() => {
  let cachedUser = null;

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
    const {
      allowPasswordChange = false,
      allowSelectGroup = false,
    } = options;

    const user = await refreshSession();
    if (!user) {
      window.location.href = "/login";
      return false;
    }

    if (user.must_change_password && !allowPasswordChange) {
      window.location.href = "/change-password";
      return false;
    }

    // BUG FIX: Only Data Cleansing users need group selection.
    // Team Leaders should never be redirected to group selection.
    if (
      user.role === "Data Cleansing" &&
      (user.group_id == null || user.group_id === "") &&
      !allowSelectGroup &&
      !user.must_change_password
    ) {
      window.location.href = "/select-group";
      return false;
    }

    return true;
  }

  async function redirectIfAuthenticated() {
    const user = await refreshSession();
    if (!user) return false;

    if (user.must_change_password) {
      window.location.href = "/change-password";
      return true;
    }
    // Only Data Cleansing users need group selection
    if (
      user.role === "Data Cleansing" &&
      (user.group_id == null || user.group_id === "")
    ) {
      window.location.href = "/select-group";
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
    initials,
  };
})();
