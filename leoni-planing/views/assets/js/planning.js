(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;
  await LeoniAuth.refreshSession();

  const loggedUser = LeoniAuth.getUser();

  const content = `
    <!-- GENERATE PLANNING SECTION -->
    <section class="panel mb-3">
      <div class="panel-header">
        <h2>Generate Home Office Calendar</h2>
      </div>
      <div class="panel-body">
        <div class="d-flex align-items-end gap-3 flex-wrap">
          ${
            loggedUser.role === "Team Leader"
              ? `<div>
                   <label for="generateUser" class="form-label text-uppercase small fw-semibold opacity-75">Employee</label>
                   <select class="form-select" id="generateUser" style="min-width: 220px;">
                     <option value="">Choose employee…</option>
                   </select>
                 </div>`
              : ""
          }
          <div>
            <label for="generateMonth" class="form-label text-uppercase small fw-semibold opacity-75">Month</label>
            <input type="month" class="form-control" id="generateMonth" style="min-width: 180px;" />
          </div>
          <button type="button" class="btn btn-leoni-primary" id="generatePlanningBtn">
            <i class="fa-solid fa-wand-magic-sparkles me-2"></i>Generate Planning
          </button>
          <span id="genStatus" class="small ms-2 align-self-center"></span>
        </div>
      </div>
    </section>

    <!-- FILTERS SECTION -->
    <section class="panel mb-3">
      <div class="panel-header">
        <h2>Filters</h2>
      </div>
      <div class="panel-body">
        <div class="filter-bar">
          <div>
            <label for="filterMonth" class="form-label">Month</label>
            <input type="month" class="form-control" id="filterMonth" style="min-width: 180px;" />
          </div>
          ${
            loggedUser.role === "Team Leader"
              ? `<div>
                   <label for="filterName" class="form-label">Name</label>
                   <input type="search" class="form-control" id="filterName" placeholder="e.g. Ahmed" style="min-width: 180px;" />
                 </div>
                 <div>
                   <label for="filterGroup" class="form-label">Group</label>
                   <select class="form-select" id="filterGroup" style="min-width: 160px;">
                     <option value="">All groups</option>
                     <option value="1">Group A</option>
                     <option value="2">Group B</option>
                   </select>
                 </div>`
              : ""
          }
          <div class="ms-auto d-flex gap-2 align-items-end">
            <button type="button" class="btn btn-leoni-primary" id="applyFiltersBtn">
              <i class="fa-solid fa-filter me-2"></i>Apply
            </button>
            <button type="button" class="btn btn-leoni-outline" id="resetFiltersBtn">
              <i class="fa-solid fa-rotate-left me-2"></i>Reset
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- SCHEDULE LIST -->
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
                <th>Month</th>
                <th>Date Remote</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="planningTableBody">
              <tr><td colspan="5" class="text-center py-4 text-muted">Loading planning…</td></tr>
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

  function getFilterParams() {
    const monthEl = document.getElementById("filterMonth");
    const nameEl = document.getElementById("filterName");
    const groupEl = document.getElementById("filterGroup");

    const params = {};
    if (monthEl && monthEl.value) params.month = monthEl.value;
    if (nameEl && nameEl.value.trim()) params.name = nameEl.value.trim();
    if (groupEl && groupEl.value) params.group_id = groupEl.value;
    return params;
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
        
        // Format DateRemote to local locale representation
        let dateStr = row.date;
        try {
          const dateObj = new Date(row.date);
          if (!Number.isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          }
        } catch {
          // fallback to raw db string
        }

        return `
          <tr>
            <td class="fw-semibold">${escapeHtml(name)}</td>
            <td><span class="badge-group ${badgeClass}">Group ${group}</span></td>
            <td>${escapeHtml(row.month_key || "—")}</td>
            <td><strong>${escapeHtml(dateStr)}</strong></td>
            <td><span class="badge-role">${escapeHtml(row.status || "remote")}</span></td>
          </tr>`;
      })
      .join("");
  }

  async function loadPlanning() {
    LeoniLayout.showLoading(true);
    try {
      const rows = await LeoniAPI.getPlanning(getFilterParams());
      renderPlanning(rows);
    } catch {
      document.getElementById("planningTableBody").innerHTML = `
        <tr><td colspan="5" class="text-center py-4 text-danger">Failed to load planning data.</td></tr>`;
    } finally {
      LeoniLayout.showLoading(false);
    }
  }

  // Populate users dropdown if Team Leader
  if (loggedUser.role === "Team Leader") {
    try {
      const users = await LeoniAPI.getUsers();
      const select = document.getElementById("generateUser");
      users
        .filter((u) => u.role === "Data Cleansing")
        .forEach((u) => {
          const opt = document.createElement("option");
          opt.value = u.id;
          opt.textContent = `${u.name} (Matricule: ${u.matricule})`;
          select.appendChild(opt);
        });
    } catch (err) {
      console.error("Failed to load users for generation dropdown", err);
    }
  }

  // Generate Planning Trigger
  document.getElementById("generatePlanningBtn").addEventListener("click", async () => {
    const monthInput = document.getElementById("generateMonth").value;
    const statusEl = document.getElementById("genStatus");
    statusEl.textContent = "";
    statusEl.style.color = "";

    if (!monthInput) {
      statusEl.textContent = "Please select a month.";
      statusEl.style.color = "var(--leoni-rouge)";
      return;
    }

    let targetUserId = loggedUser.id;
    if (loggedUser.role === "Team Leader") {
      const selectVal = document.getElementById("generateUser").value;
      if (!selectVal) {
        statusEl.textContent = "Please select an employee.";
        statusEl.style.color = "var(--leoni-rouge)";
        return;
      }
      targetUserId = selectVal;
    }

    LeoniLayout.showLoading(true);
    try {
      const res = await LeoniAPI.generatePlanning(targetUserId, monthInput);
      statusEl.textContent = res.message || "Planning generated successfully!";
      statusEl.style.color = "var(--leoni-bleu)";
      // Reload planning view
      await loadPlanning();
    } catch (err) {
      statusEl.textContent = err.message || "Failed to generate planning.";
      statusEl.style.color = "var(--leoni-rouge)";
    } finally {
      LeoniLayout.showLoading(false);
    }
  });

  document.getElementById("applyFiltersBtn").addEventListener("click", loadPlanning);
  
  const nameFilter = document.getElementById("filterName");
  if (nameFilter) {
    nameFilter.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loadPlanning();
    });
  }

  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("filterMonth").value = "";
    const filterName = document.getElementById("filterName");
    const filterGroup = document.getElementById("filterGroup");
    if (filterName) filterName.value = "";
    if (filterGroup) filterGroup.value = "";
    loadPlanning();
  });

  // Set default values for generation datepicker (e.g. next month if after 25th)
  const today = new Date();
  let defaultMonthVal = today.toISOString().slice(0, 7);
  if (today.getDate() >= 25) {
    const nextMonthObj = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    defaultMonthVal = nextMonthObj.toISOString().slice(0, 7);
  }
  document.getElementById("generateMonth").value = defaultMonthVal;
  document.getElementById("filterMonth").value = defaultMonthVal;

  await loadPlanning();
})();
