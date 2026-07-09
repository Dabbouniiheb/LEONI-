(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;
  await LeoniAuth.refreshSession();

  const loggedUser = LeoniAuth.getUser();

  // Determine current/next target validation month based on business day 25
  const today = new Date();
  let targetMonthKey = today.toISOString().slice(0, 7);
  let isNextMonth = false;
  
  if (today.getDate() >= 25) {
    isNextMonth = true;
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    targetMonthKey = nextMonth.toISOString().slice(0, 7);
  }

  const content = `
    <!-- ALERTS / NOTIFICATIONS SECTION -->
    <div id="dashboardAlerts" class="mb-4"></div>

    <!-- STATS WIDGETS -->
    <div class="row g-3 mb-4" id="statsRow">
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card accent-red">
          <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
          <div class="stat-label">Total Users</div>
          <p class="stat-value" id="statTotalUsers">—</p>
        </article>
      </div>
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-percent"></i></div>
          <div class="stat-label">Validation Rate (${targetMonthKey})</div>
          <p class="stat-value" id="statValidationRate">—</p>
        </article>
      </div>
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
          <div class="stat-label">Group A / B Users</div>
          <p class="stat-value" id="statGroups">—</p>
        </article>
      </div>
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="stat-label">Completed Plannings (${targetMonthKey})</div>
          <p class="stat-value" id="statCompleted">—</p>
        </article>
      </div>
    </div>

    <!-- MAIN DASHBOARD CONTENT -->
    <div class="row g-3">
      <div class="col-lg-8" id="dashboardMainCol">
        <section class="panel h-100">
          <div class="panel-header d-flex justify-content-between align-items-center">
            <h2>Overview</h2>
            <span class="badge-role bg-primary text-white">Role: ${loggedUser.role}</span>
          </div>
          <div class="panel-body">
            <p class="mb-4">
              Welcome to the LEONI internal planning dashboard. Monitor workforce distribution,
              review schedules, and validate monthly planning.
            </p>
            <div class="d-flex flex-wrap gap-2">
              ${
                loggedUser.role === "Team Leader"
                  ? `<a href="/users-page" class="btn btn-leoni-outline"><i class="fa-solid fa-users me-2"></i>Manage Users</a>
                     <a href="/export-page" class="btn btn-leoni-outline"><i class="fa-solid fa-file-export me-2"></i>Export Excel</a>
                     <a href="/logs-page" class="btn btn-leoni-outline"><i class="fa-solid fa-clipboard-list me-2"></i>Audit Logs</a>`
                  : ""
              }
              <a href="/planning-page" class="btn btn-leoni-outline"><i class="fa-solid fa-calendar-days me-2"></i>My Planning</a>
              <a href="/change-password" class="btn btn-leoni-outline"><i class="fa-solid fa-key me-2"></i>Security Settings</a>
            </div>
          </div>
        </section>
      </div>

      <div class="col-lg-4">
        <section class="panel h-100">
          <div class="panel-header">
            <h2>Quick info</h2>
          </div>
          <div class="panel-body">
            <ul class="list-unstyled mb-0 small">
              <li class="mb-2"><i class="fa-solid fa-circle-check me-2" style="color: var(--leoni-cyan)"></i>Group A: Wednesday, Thursday, Alternate Friday A</li>
              <li class="mb-2"><i class="fa-solid fa-circle-check me-2" style="color: var(--leoni-cyan)"></i>Group B: Monday, Tuesday, Alternate Friday B</li>
              <li class="mb-2"><i class="fa-solid fa-circle-check me-2" style="color: var(--leoni-cyan)"></i>Selection window opens on the 25th of each month</li>
              <li class="mb-0"><i class="fa-solid fa-circle-check me-2" style="color: var(--leoni-cyan)"></i>Audit log actions logged dynamically</li>
            </ul>
          </div>
        </section>
      </div>
    </div>`;

  LeoniLayout.mount({
    pageId: "dashboard",
    title: "Dashboard",
    subtitle: "Workforce planning overview",
    contentHtml: content,
  });

  LeoniLayout.showLoading(true);
  try {
    // 1. Fetch Stats & populate stat cards
    const stats = await LeoniAPI.getStats({ month: targetMonthKey });
    document.getElementById("statTotalUsers").textContent = stats.totalUsers ?? 0;
    document.getElementById("statValidationRate").textContent = `${stats.validationRate ?? 0}%`;
    document.getElementById("statGroups").textContent = `${stats.groupA} / ${stats.groupB}`;
    document.getElementById("statCompleted").textContent = `${stats.planningCompleted ?? 0} user(s)`;

    // 2. Render Role-Based Notifications and Widgets
    const alertsContainer = document.getElementById("dashboardAlerts");
    
    if (loggedUser.role === "Data Cleansing") {
      // Check if user has generated planning for the target month
      const userPlanning = await LeoniAPI.getPlanningByUser(loggedUser.id);
      const hasPlanningForTargetMonth = userPlanning.some(row => row.month_key === targetMonthKey);

      if (hasPlanningForTargetMonth) {
        // Green state (Validé)
        alertsContainer.innerHTML = `
          <div class="alert alert-success d-flex align-items-center mb-0 p-3" style="border-radius: var(--leoni-radius); border-left: 5px solid #198754;">
            <i class="fa-solid fa-circle-check fa-lg me-3 text-success"></i>
            <div>
              <strong>Statut : Validé (Vert)</strong><br/>
              Votre planning Home Office pour le mois de <strong>${targetMonthKey}</strong> a été généré et validé avec succès.
            </div>
          </div>`;
      } else {
        if (isNextMonth) {
          // Orange state (En attente)
          alertsContainer.innerHTML = `
            <div class="alert alert-warning d-flex align-items-center mb-0 p-3" style="border-radius: var(--leoni-radius); border-left: 5px solid #ffc107;">
              <i class="fa-solid fa-clock fa-lg me-3 text-warning"></i>
              <div>
                <strong>Statut : En attente (Orange)</strong><br/>
                Veuillez sélectionner votre groupe Home Office et générer votre planning pour le mois prochain (<strong>${targetMonthKey}</strong>) avant la fin du mois.
                <a href="/planning-page" class="alert-link ms-2">Générer maintenant <i class="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>`;
        } else {
          // Red state (Délai dépassé)
          alertsContainer.innerHTML = `
            <div class="alert alert-danger d-flex align-items-center mb-0 p-3" style="border-radius: var(--leoni-radius); border-left: 5px solid #dc3545;">
              <i class="fa-solid fa-triangle-exclamation fa-lg me-3 text-danger"></i>
              <div>
                <strong>Statut : Délai dépassé (Rouge)</strong><br/>
                Vous n'avez pas validé votre planning Home Office pour le mois en cours (<strong>${targetMonthKey}</strong>). Veuillez le soumettre immédiatement.
                <a href="/planning-page" class="alert-link ms-2">Générer maintenant <i class="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>`;
        }
      }
    } else if (loggedUser.role === "Team Leader") {
      // Render general validation banner
      alertsContainer.innerHTML = `
        <div class="alert alert-info d-flex align-items-center mb-0 p-3" style="border-radius: var(--leoni-radius); border-left: 5px solid #0dcaf0;">
          <i class="fa-solid fa-circle-info fa-lg me-3 text-info"></i>
          <div>
            <strong>Validation System Active</strong><br/>
            Current validation rate for month <strong>${targetMonthKey}</strong> is <strong>${stats.validationRate}%</strong>.
            You can monitor and generate planning for employees below.
          </div>
        </div>`;

      // Render validation tracking table for Team Leaders
      const users = await LeoniAPI.getUsers();
      const planningData = await LeoniAPI.getPlanning({ month: targetMonthKey });

      const employees = users.filter(u => u.role === "Data Cleansing");
      const validatedUserIds = new Set(planningData.map(row => row.user_id));

      const rowsHtml = employees.map(emp => {
        const isValidated = validatedUserIds.has(emp.id);
        const statusBadge = isValidated 
          ? `<span class="badge bg-success">Validé</span>` 
          : (isNextMonth 
              ? `<span class="badge bg-warning text-dark">En attente</span>` 
              : `<span class="badge bg-danger">Délai dépassé</span>`
            );
        const groupLabel = LeoniLayout.formatGroup(emp.group_id);
        const groupBadge = LeoniLayout.groupBadgeClass(emp.group_id);

        return `
          <tr>
            <td><code>${emp.matricule}</code></td>
            <td class="fw-semibold">${escapeHtml(emp.name)}</td>
            <td><span class="badge-group ${groupBadge}">Group ${groupLabel}</span></td>
            <td>${escapeHtml(emp.department || "—")}</td>
            <td>${statusBadge}</td>
          </tr>`;
      }).join("");

      const trackerHtml = `
        <section class="panel mt-4">
          <div class="panel-header">
            <h2>Employee Validation Tracker - ${targetMonthKey}</h2>
          </div>
          <div class="panel-body p-0">
            <div class="table-responsive">
              <table class="table table-leoni table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Employee</th>
                    <th>Group</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml || `<tr><td colspan="5" class="text-center py-3 text-muted">No employees registered yet.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </section>`;

      // Inject the tracker widget right after the main row
      const mainCol = document.getElementById("dashboardMainCol");
      mainCol.insertAdjacentHTML("afterend", `<div class="col-12">${trackerHtml}</div>`);
    }

  } catch (err) {
    console.error("Dashboard render error:", err);
    document.getElementById("statsRow").innerHTML = `
      <div class="col-12">
        <div class="alert alert-leoni alert-danger mb-0">
          Unable to load dashboard statistics. Please verify the database connection.
        </div>
      </div>`;
  } finally {
    LeoniLayout.showLoading(false);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
