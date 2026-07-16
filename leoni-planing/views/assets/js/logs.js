(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;

  const content = `
    <section class="panel">
      <div class="panel-header">
        <h2>Audit logs</h2>
        <span class="text-muted small">Last 100 events</span>
      </div>
      <div class="panel-body p-0">
        <div class="table-responsive">
          <table class="table table-leoni table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>User ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Date</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="logsTableBody">
              <tr><td colspan="5" class="text-center py-4 text-muted">Loading audit logs…</td></tr>
            </tbody>
          </table>
        </div>
        <div id="logsEmpty" class="empty-state d-none">
          <div><i class="fa-solid fa-clipboard-list"></i></div>
          <p class="mb-0">No audit log entries yet.</p>
        </div>
      </div>
    </section>`;

  LeoniLayout.mount({
    pageId: "logs",
    title: "Audit Logs",
    subtitle: "Security and activity trail",
    contentHtml: content,
  });

  const escapeHtml = LeoniLayout.escapeHtml;

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return escapeHtml(value);
    return d.toLocaleString();
  }

  function renderLogs(rows) {
    const tbody = document.getElementById("logsTableBody");
    const empty = document.getElementById("logsEmpty");

    if (!rows.length) {
      tbody.innerHTML = "";
      empty.classList.remove("d-none");
      return;
    }

    empty.classList.add("d-none");
    tbody.innerHTML = rows
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.user_id)}</td>
          <td class="fw-semibold">${escapeHtml(row.user_name || "—")}</td>
          <td><span class="badge-role">${escapeHtml(row.action)}</span></td>
          <td>${formatDate(row.created_at)}</td>
          <td class="text-muted small">${escapeHtml(row.details || "—")}</td>
        </tr>`
      )
      .join("");
  }

  LeoniLayout.showLoading(true);
  try {
    const rows = await LeoniAPI.getLogs();
    renderLogs(rows);
  } catch {
    document.getElementById("logsTableBody").innerHTML = `
      <tr><td colspan="5" class="text-center py-4 text-danger">Failed to load audit logs.</td></tr>`;
  } finally {
    LeoniLayout.showLoading(false);
  }
})();
