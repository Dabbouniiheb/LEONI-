/**
 * LEONI API Client
 *
 * Centralized communication layer for application API endpoints.
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
    const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    
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
      let errorCode = null;
      let details = null;
      if (contentType.includes("application/json")) {
        const data = await response.json();
        message = data.message || message;
        redirect = data.redirect || null;
        errorCode = data.code || null;
        details = data.details || data.errors || null;
      }
      const err = new Error(message);
      err.status = response.status;
      err.redirect = redirect;
      err.code = errorCode;
      err.details = details;
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

  function sendJsonBeacon(path, payload) {
    if (!csrfToken || !navigator.sendBeacon) return false;
    const blob = new Blob(
      [JSON.stringify({ ...payload, _csrf: csrfToken })],
      { type: "application/json" }
    );
    return navigator.sendBeacon(path, blob);
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
    getPlanningCalendars: () => request("/api/planning/calendar"),
    getPlanning: (filters = {}) =>
      request(`/api/planning${buildQuery(filters)}`),
    getPlanningByUser: (userId) => request(`/api/planning/${userId}`),
    getPlanningGenerationWindow: () => request("/api/planning/generation-window"),
    generatePlanning: (user_id, month) =>
      request("/api/planning/generate", {
        method: "POST",
        body: JSON.stringify({ user_id, month }),
      }),

    // Monthly Home Office group selections
    getMyMonthlyGroupSelection: (month) =>
      request(`/api/monthly-group-selections/mine${buildQuery({ month })}`),
    saveMyMonthlyGroupSelection: (month, group_id) =>
      request("/api/monthly-group-selections/mine", {
        method: "PUT",
        body: JSON.stringify({ month, group_id }),
      }),
    getMonthlyGroupSelectionStatus: (month) =>
      request(`/api/monthly-group-selections${buildQuery({ month })}`),

    // Work Sessions
    autoStartWorkSession: (planning_id) =>
      request("/api/work-sessions/auto-start", {
        method: "POST",
        body: JSON.stringify(planning_id ? { planning_id } : {}),
      }),
    heartbeatWorkSession: (session_id, is_active) =>
      request("/api/work-sessions/heartbeat", {
        method: "POST",
        body: JSON.stringify({ session_id, is_active }),
      }),
    pauseWorkSession: (session_id) =>
      request("/api/work-sessions/pause", {
        method: "POST",
        body: JSON.stringify({ session_id }),
      }),
    endWorkSession: (session_id) =>
      request("/api/work-sessions/end", {
        method: "POST",
        body: JSON.stringify({ session_id }),
      }),
    getMyWorkSessions: (filters = {}) =>
      request(`/api/work-sessions/mine${buildQuery(filters)}`),
    getWorkSessionSummary: (filters = {}) =>
      request(`/api/work-sessions/summary${buildQuery(filters)}`),
    pauseWorkSessionBeacon: (session_id) =>
      sendJsonBeacon("/api/work-sessions/pause", { session_id }),
    endWorkSessionBeacon: (session_id) =>
      sendJsonBeacon("/api/work-sessions/end", { session_id }),

    // Leave Requests
    getOwnLeaveRequests: () => request("/api/leave-requests/mine"),
    getAllLeaveRequests: () => request("/api/leave-requests"),
    createLeaveRequest: (body) =>
      request("/api/leave-requests", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    cancelLeaveRequest: (id) =>
      request(`/api/leave-requests/${id}/cancel`, { method: "PATCH" }),
    approveLeaveRequest: (id, body) =>
      request(`/api/leave-requests/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify(body || {}),
      }),
    rejectLeaveRequest: (id, body) =>
      request(`/api/leave-requests/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify(body || {}),
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
