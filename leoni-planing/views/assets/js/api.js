const LeoniAPI = (() => {
  const base = "";

  async function request(path, options = {}) {
    const config = {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    };

    const response = await fetch(`${base}${path}`, config);
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
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
    getSession: () => request("/api/session"),
    logout: () => request("/logout", { method: "POST" }),
    getStats: (filters = {}) => request(`/stats${buildQuery(filters)}`),
    getUsers: () => request("/users"),
    createUser: (body) =>
      request("/register", { method: "POST", body: JSON.stringify(body) }),
    updateUser: (id, body) =>
      request(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
    getAllPlanning: () => request("/all-planning"),
    getPlanning: (filters = {}) =>
      request(`/planning${buildQuery(filters)}`),
    getPlanningByUser: (userId) => request(`/planning/${userId}`),
    generatePlanning: (user_id, month) =>
      request("/generate-planning", {
        method: "POST",
        body: JSON.stringify({ user_id, month }),
      }),
    getLogs: () => request("/logs"),
    login: (email, password) =>
      request("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    changePassword: (body) =>
      request("/change-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    selectGroup: (group_id) =>
      request("/select-group", {
        method: "POST",
        body: JSON.stringify({ group_id }),
      }),
    exportPlanning: (filters = {}) =>
      fetch(`/export-planning${buildQuery(filters)}`, { credentials: "same-origin" }),
    exportPlanningXlsx: (filters = {}) =>
      fetch(`/export-xlsx${buildQuery(filters)}`, { credentials: "same-origin" }),
  };
})();
