if (!LeoniAuth.requireAuth()) {
  // redirecting
} else {
  const content = `
    <section class="panel mb-3">
      <div class="panel-header">
        <h2>Filters</h2>
      </div>
      <div class="panel-body">
        <div class="filter-bar">
          <div>
            <label for="filterUser" class="form-label">User</label>
            <select class="form-select" id="filterUser" style="min-width: 220px;">
              <option value="">All users</option>
            </select>
          </div>
          <div>
            <label for="filterGroup" class="form-label">Group</label>
            <select class="form-select" id="filterGroup" style="min-width: 160px;">
              <option value="">All groups</option>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
            </select>
          </div>
          <div class="ms-auto">
            <button type="button" class="btn btn-leoni-outline" id="resetFiltersBtn">
              <i class="fa-solid fa-rotate-left me-2"></i>Reset
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Planning schedule</h2>
        <span class="text-muted small" id="planningCount"></span>
      </div>
      <div class="panel-body p-0">
        <div class="table-responsive">
          <table class="table table-leoni table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Group</th>
                <th>Day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="planningTableBody">
              <tr><td colspan="4" class="text-center py-4 text-muted">Loading planning…</td></tr>
            </tbody>
          </table>
        </div>
        <div id="planningEmpty" class="empty-state d-none">
          <div><i class="fa-solid fa-calendar-xmark"></i></div>
          <p class="mb-0">No planning entries match your filters.</p>
        </div>
      </div>
    </section>`;

  LeoniLayout.mount({
    pageId: "planning",
    title: "Planning",
    subtitle: "Office schedule by user and group",
    contentHtml: content,
  });

  let allRows = [];
  let usersList = [];

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeGroup(groupId) {
    return LeoniLayout.formatGroup(groupId);
  }

  function populateUserFilter(users) {
    const select = document.getElementById("filterUser");
    users.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name;
      select.appendChild(opt);
    });
  }

  function renderPlanning(rows) {
    const tbody = document.getElementById("planningTableBody");
    const empty = document.getElementById("planningEmpty");
    document.getElementById("planningCount").textContent = `${rows.length} entr${rows.length === 1 ? "y" : "ies"}`;

    if (!rows.length) {
      tbody.innerHTML = "";
      empty.classList.remove("d-none");
      return;
    }

    empty.classList.add("d-none");
    tbody.innerHTML = rows
      .map((row) => {
        const group = normalizeGroup(row.group_id);
        const badgeClass = LeoniLayout.groupBadgeClass(row.group_id);
        const name = row.user_name || row.name || `User #${row.user_id}`;
        return `
          <tr>
            <td class="fw-semibold">${escapeHtml(name)}</td>
            <td><span class="badge-group ${badgeClass}">Group ${group}</span></td>
            <td>${escapeHtml(row.date)}</td>
            <td><span class="badge-role">${escapeHtml(row.status || "office")}</span></td>
          </tr>`;
      })
      .join("");
  }

  function applyFilters() {
    const userId = document.getElementById("filterUser").value;
    const group = document.getElementById("filterGroup").value;

    let filtered = [...allRows];

    if (group) {
      filtered = filtered.filter((r) => normalizeGroup(r.group_id) === group);
    }

    if (userId) {
      filtered = filtered.filter((r) => String(r.user_id) === String(userId));
    }

    renderPlanning(filtered);
  }

  async function loadAllPlanning() {
    LeoniLayout.showLoading(true);
    try {
      allRows = await LeoniAPI.getAllPlanning();
      applyFilters();
    } catch {
      document.getElementById("planningTableBody").innerHTML = `
        <tr><td colspan="4" class="text-center py-4 text-danger">Failed to load planning data.</td></tr>`;
    } finally {
      LeoniLayout.showLoading(false);
    }
  }

  async function loadUserPlanning(userId) {
    LeoniLayout.showLoading(true);
    try {
      const rows = await LeoniAPI.getPlanningByUser(userId);
      allRows = rows.map((r) => ({
        ...r,
        user_name: r.name,
        group_id: usersList.find((u) => String(u.id) === String(userId))?.group_id,
      }));
      applyFilters();
    } catch {
      document.getElementById("planningTableBody").innerHTML = `
        <tr><td colspan="4" class="text-center py-4 text-danger">Failed to load user planning.</td></tr>`;
    } finally {
      LeoniLayout.showLoading(false);
    }
  }

  document.getElementById("filterUser").addEventListener("change", async (e) => {
    const userId = e.target.value;
    if (!userId) {
      await loadAllPlanning();
      return;
    }
    await loadUserPlanning(userId);
  });

  document.getElementById("filterGroup").addEventListener("change", () => {
    applyFilters();
  });

  document.getElementById("resetFiltersBtn").addEventListener("click", async () => {
    document.getElementById("filterUser").value = "";
    document.getElementById("filterGroup").value = "";
    await loadAllPlanning();
  });

  (async () => {
    LeoniLayout.showLoading(true);
    try {
      usersList = await LeoniAPI.getUsers();
      populateUserFilter(usersList);
      allRows = await LeoniAPI.getAllPlanning();
      applyFilters();
    } catch {
      document.getElementById("planningTableBody").innerHTML = `
        <tr><td colspan="4" class="text-center py-4 text-danger">Failed to load data.</td></tr>`;
    } finally {
      LeoniLayout.showLoading(false);
    }
  })();
}
