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

    if (
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
    if (user.group_id == null || user.group_id === "") {
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
    ensureAccess,
    redirectIfAuthenticated,
    initials,
  };
})();
