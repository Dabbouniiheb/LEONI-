if (!LeoniAuth.requireAuth()) {
  // redirecting
} else {
  const content = `
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
          <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="stat-label">Planning Entries</div>
          <p class="stat-value" id="statTotalPlanning">—</p>
        </article>
      </div>
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
          <div class="stat-label">Group A Users</div>
          <p class="stat-value" id="statGroupA">—</p>
        </article>
      </div>
      <div class="col-sm-6 col-xl-3">
        <article class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
          <div class="stat-label">Group B Users</div>
          <p class="stat-value" id="statGroupB">—</p>
        </article>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-lg-8">
        <section class="panel h-100">
          <div class="panel-header">
            <h2>Overview</h2>
          </div>
          <div class="panel-body">
            <p class="mb-3">
              Welcome to the LEONI internal planning dashboard. Monitor workforce distribution,
              review schedules, and export planning data for reporting.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <a href="/users-page" class="btn btn-leoni-outline">
                <i class="fa-solid fa-users me-2"></i>Manage users
              </a>
              <a href="/planning-page" class="btn btn-leoni-outline">
                <i class="fa-solid fa-calendar-days me-2"></i>View planning
              </a>
              <a href="/export-page" class="btn btn-leoni-primary">
                <i class="fa-solid fa-file-export me-2"></i>Export planning
              </a>
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
              <li class="mb-2"><i class="fa-solid fa-circle-check me-2" style="color: var(--leoni-bleu)"></i>Authentication enabled</li>
              <li class="mb-2"><i class="fa-solid fa-circle-check me-2" style="color: var(--leoni-bleu)"></i>Group A / B scheduling</li>
              <li class="mb-0"><i class="fa-solid fa-circle-check me-2" style="color: var(--leoni-bleu)"></i>Audit logs on backend</li>
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

  (async () => {
    LeoniLayout.showLoading(true);
    try {
      const stats = await LeoniAPI.getStats();
      document.getElementById("statTotalUsers").textContent = stats.totalUsers ?? 0;
      document.getElementById("statTotalPlanning").textContent = stats.totalPlanning ?? 0;
      document.getElementById("statGroupA").textContent = stats.groupA ?? 0;
      document.getElementById("statGroupB").textContent = stats.groupB ?? 0;
    } catch {
      document.getElementById("statsRow").innerHTML = `
        <div class="col-12">
          <div class="alert alert-leoni alert-danger mb-0">
            Unable to load dashboard statistics. Please verify the server and database connection.
          </div>
        </div>`;
    } finally {
      LeoniLayout.showLoading(false);
    }
  })();
}
