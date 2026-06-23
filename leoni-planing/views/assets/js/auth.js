const LeoniAuth = (() => {
  const STORAGE_KEY = "leoni_user";

  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const safe = { ...user };
    delete safe.password;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/login";
  }

  function requireAuth() {
    if (!getUser()) {
      window.location.href = "/login";
      return false;
    }
    return true;
  }

  function redirectIfAuthenticated() {
    if (getUser()) {
      window.location.href = "/dashboard";
      return true;
    }
    return false;
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
    logout,
    requireAuth,
    redirectIfAuthenticated,
    initials,
  };
})();
