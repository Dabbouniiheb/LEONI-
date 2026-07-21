(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;

  const loggedUser = LeoniAuth.getUser();
  const escapeHtml = LeoniLayout.escapeHtml;
  let targetMonthKey = "";
  let isNextMonth = false;

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
          <div class="stat-label">Validation Rate (<span data-dashboard-target-month>—</span>)</div>
          <p class="stat-value" id="statValidationRate">—</p>
        </article>
      </div>
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
          <div class="stat-label">Monthly Groups A / B (<span data-dashboard-target-month>—</span>)</div>
          <p class="stat-value" id="statGroups">—</p>
        </article>
      </div>
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="stat-label">Completed Plannings (<span data-dashboard-target-month>—</span>)</div>
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
            <span class="badge-role bg-primary text-white">Role: ${escapeHtml(loggedUser.role)}</span>
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
            <ul class="list-unstyled mb-0 small quick-info-list">
              <li class="mb-2"><i class="fa-solid fa-circle-check quick-info-icon"></i><span>Group A: Wednesday, Thursday, Alternate Friday A</span></li>
              <li class="mb-2"><i class="fa-solid fa-circle-check quick-info-icon"></i><span>Group B: Monday, Tuesday, Alternate Friday B</span></li>
              <li class="mb-2"><i class="fa-solid fa-circle-check quick-info-icon"></i><span>Selection window opens on the 25th of each month</span></li>
              <li class="mb-0"><i class="fa-solid fa-circle-check quick-info-icon"></i><span>Audit log actions logged dynamically</span></li>
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
    const generationWindowResponse = await LeoniAPI.getPlanningGenerationWindow();
    const generationWindow = generationWindowResponse.window;
    isNextMonth = Boolean(generationWindow?.is_open && generationWindow.allowed_month);
    targetMonthKey = isNextMonth
      ? generationWindow.allowed_month
      : generationWindow?.current_month;
    if (!/^\d{4}-\d{2}$/.test(String(targetMonthKey || ""))) {
      throw new Error("Unable to determine the dashboard target month");
    }
    document.querySelectorAll("[data-dashboard-target-month]").forEach((label) => {
      label.textContent = targetMonthKey;
    });
    const targetMonthLabel = escapeHtml(targetMonthKey);

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
          <div class="alert alert-success status-alert status-alert-success d-flex align-items-center mb-0 p-3">
            <i class="fa-solid fa-circle-check status-alert-icon me-3 text-success"></i>
            <div>
              <strong>Statut : Validé (Vert)</strong><br/>
              Votre planning Home Office pour le mois de <strong>${targetMonthLabel}</strong> a été généré et validé avec succès.
            </div>
          </div>`;
      } else {
        if (isNextMonth) {
          // Orange state (En attente)
          alertsContainer.innerHTML = `
            <div class="alert alert-warning status-alert status-alert-warning d-flex align-items-center mb-0 p-3">
              <i class="fa-solid fa-clock status-alert-icon me-3 text-warning"></i>
              <div>
                <strong>Statut : En attente (Orange)</strong><br/>
                Veuillez sélectionner votre groupe Home Office et générer votre planning pour le mois prochain (<strong>${targetMonthLabel}</strong>) avant la fin du mois.
                <a href="/planning-page" class="alert-link ms-2">Générer maintenant <i class="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>`;
        } else {
          // Red state (Délai dépassé)
          alertsContainer.innerHTML = `
            <div class="alert alert-danger status-alert status-alert-danger d-flex align-items-center mb-0 p-3">
              <i class="fa-solid fa-triangle-exclamation status-alert-icon me-3 text-danger"></i>
              <div>
                <strong>Statut : Délai dépassé (Rouge)</strong><br/>
                Vous n'avez pas validé votre planning Home Office pour le mois en cours (<strong>${targetMonthLabel}</strong>). Veuillez le soumettre immédiatement.
                <a href="/planning-page" class="alert-link ms-2">Générer maintenant <i class="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>`;
        }
      }
    } else if (loggedUser.role === "Team Leader") {
      // Render general validation banner
      alertsContainer.innerHTML = `
        <div class="alert alert-info status-alert status-alert-info d-flex align-items-center mb-0 p-3">
          <i class="fa-solid fa-circle-info status-alert-icon me-3 text-info"></i>
          <div>
            <strong>Validation System Active</strong><br/>
            Current validation rate for month <strong>${targetMonthLabel}</strong> is <strong>${escapeHtml(stats.validationRate)}%</strong>.
            You can monitor and generate planning for employees below.
          </div>
        </div>`;

      // Render validation tracking table for Team Leaders
      const [users, planningData, monthlyStatus] = await Promise.all([
        LeoniAPI.getUsers(),
        LeoniAPI.getPlanning({ month: targetMonthKey }),
        LeoniAPI.getMonthlyGroupSelectionStatus(targetMonthKey),
      ]);

      const employees = users.filter(u => u.role === "Data Cleansing");
      const validatedUserIds = new Set(planningData.map(row => row.user_id));
      const monthlySelectionByUser = new Map(
        monthlyStatus.selections.map((item) => [String(item.user_id), item.selection])
      );

      const rowsHtml = employees.map(emp => {
        const isValidated = validatedUserIds.has(emp.id);
        const statusBadge = isValidated 
          ? `<span class="badge bg-success">Validé</span>` 
          : (isNextMonth 
              ? `<span class="badge bg-warning text-dark">En attente</span>` 
              : `<span class="badge bg-danger">Délai dépassé</span>`
            );
        const monthlySelection = monthlySelectionByUser.get(String(emp.id));
        const monthlyGroupId = monthlySelection?.group_id ?? null;
        const groupLabel = LeoniLayout.formatGroup(monthlyGroupId);
        const groupBadge = LeoniLayout.groupBadgeClass(monthlyGroupId);
        const groupHtml = monthlySelection
          ? `<span class="badge-group ${groupBadge}">Group ${escapeHtml(groupLabel)}</span>`
          : `<span class="text-muted">Not selected</span>`;

        return `
          <tr>
            <td><code>${escapeHtml(emp.matricule)}</code></td>
            <td class="fw-semibold">${escapeHtml(emp.name)}</td>
            <td>${groupHtml}</td>
            <td>${escapeHtml(emp.department || "—")}</td>
            <td>${statusBadge}</td>
          </tr>`;
      }).join("");

      const trackerHtml = `
        <section class="panel mt-4">
          <div class="panel-header">
            <h2>Employee Validation Tracker - ${targetMonthLabel}</h2>
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

})();
