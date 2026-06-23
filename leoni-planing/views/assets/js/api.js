const LeoniAPI = (() => {
  const base = "";

  async function request(path, options = {}) {
    const config = {
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
      if (contentType.includes("application/json")) {
        const data = await response.json();
        message = data.message || message;
      }
      throw new Error(message);
    }

    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response;
  }

  return {
    getStats: () => request("/stats"),
    getUsers: () => request("/users"),
    updateUser: (id, body) =>
      request(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
    getAllPlanning: () => request("/all-planning"),
    getPlanningByUser: (userId) => request(`/planning/${userId}`),
    login: (email, password) =>
      request("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    exportPlanning: () => fetch("/export-planning"),
  };
})();
