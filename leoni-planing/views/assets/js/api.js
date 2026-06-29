/**
 * LEONI API Client
 *
 * Centralized API communication layer.
 * All endpoints updated to use /api/ prefix.
 */
const LeoniAPI = (() => {
  const base = "";
  let csrfToken = null;

  async function fetchCsrfToken() {
    if (!csrfToken) {
      try {
        const res = await fetch(`${base}/api/auth/csrf-token`);
        if (res.ok) {
          const data = await res.json();
          csrfToken = data.csrfToken;
        }
      } catch (err) {
        console.error("Failed to fetch CSRF token");
      }
    }
    return csrfToken;
  }

  async function request(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const isStateChanging = ["POST", "PUT", "DELETE"].includes(method);
    
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (isStateChanging) {
      const token = await fetchCsrfToken();
      if (token) {
        headers["CSRF-Token"] = token;
      }
    }

    const config = {
      credentials: "same-origin",
      headers,
      ...options,
    };

    const response = await fetch(`${base}${path}`, config);
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      // If forbidden due to CSRF (403), force a refresh of the token on next request
      if (response.status === 403) {
        csrfToken = null;
      }

      let message = `Request failed (${response.status})`;
      let redirect = null;
      if (contentType.includes("application/json")) {
        const data = await response.json();
        message = data.message || message;
        redirect = data.redirect || null;
      }
      const err = new Error(message);
      err.status = response.status;
      err.redirect = redirect;
      throw err;
    }

    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response;
  }

  function buildQuery(params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val != null && String(val).trim() !== "") {
        q.set(key, val);
      }
    });
    const s = q.toString();
    return s ? `?${s}` : "";
  }

  return {
    // Auth
    getSession: () => request("/api/auth/session"),
    login: (email, password) =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request("/api/auth/logout", { method: "POST" }),
    changePassword: (body) =>
      request("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    selectGroup: (group_id) =>
      request("/api/auth/select-group", {
        method: "POST",
        body: JSON.stringify({ group_id }),
      }),

    // Dashboard
    getStats: (filters = {}) =>
      request(`/api/dashboard/stats${buildQuery(filters)}`),

    // Users
    getUsers: () => request("/api/users"),
    createUser: (body) =>
      request("/api/users", { method: "POST", body: JSON.stringify(body) }),
    updateUser: (id, body) =>
      request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteUser: (id) =>
      request(`/api/users/${id}`, { method: "DELETE" }),

    // Planning
    getAllPlanning: () => request("/api/planning/all"),
    getPlanning: (filters = {}) =>
      request(`/api/planning${buildQuery(filters)}`),
    getPlanningByUser: (userId) => request(`/api/planning/${userId}`),
    generatePlanning: (user_id, month) =>
      request("/api/planning/generate", {
        method: "POST",
        body: JSON.stringify({ user_id, month }),
      }),

    // Export (returns raw response for blob download)
    exportPlanning: (filters = {}) =>
      fetch(`/api/export/csv${buildQuery(filters)}`, {
        credentials: "same-origin",
      }),
    exportPlanningXlsx: (filters = {}) =>
      fetch(`/api/export/xlsx${buildQuery(filters)}`, {
        credentials: "same-origin",
      }),

    // Audit Logs
    getLogs: () => request("/api/logs"),
  };
})();
