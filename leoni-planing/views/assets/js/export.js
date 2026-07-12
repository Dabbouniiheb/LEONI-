(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;
  await LeoniAuth.refreshSession();

  const loggedUser = LeoniAuth.getUser();

  const content = `
    <!-- FILTERS FOR EXPORT -->
    <section class="panel mb-3">
      <div class="panel-header">
        <h2>Export Filters</h2>
      </div>
      <div class="panel-body">
        <div class="filter-bar">
          <div>
            <label for="exportMonth" class="form-label">Month</label>
            <input type="month" class="form-control form-field-md" id="exportMonth" />
          </div>
          <div>
            <label for="exportGroup" class="form-label">Group</label>
            <select class="form-select form-field-sm" id="exportGroup">
              <option value="">All groups</option>
              <option value="1">Group A</option>
              <option value="2">Group B</option>
            </select>
          </div>
          <div>
            <label for="exportUser" class="form-label">Employee</label>
            <select class="form-select form-field-lg" id="exportUser">
              <option value="">All employees</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-body export-hero">
        <div class="export-hero-icon">
          <i class="fa-solid fa-file-excel"></i>
        </div>
        <h2 class="h4 mb-2">Export planning data</h2>
        <p class="text-muted mb-4 mx-auto export-copy">
          Download the planning schedule as CSV or Excel (XLSX).
          Applies the filters selected above (all records exported by default).
        </p>
        <div class="d-flex flex-wrap justify-content-center gap-2">
          <button type="button" class="btn btn-lg btn-leoni-primary px-4" id="exportCsvBtn">
            <i class="fa-solid fa-file-csv me-2"></i>
            <span id="exportCsvLabel">Export CSV</span>
            <span id="exportCsvSpinner" class="spinner-border spinner-border-sm ms-2 d-none" role="status"></span>
          </button>
          <button type="button" class="btn btn-lg btn-leoni-outline px-4" id="exportXlsxBtn">
            <i class="fa-solid fa-file-excel me-2"></i>
            <span id="exportXlsxLabel">Export XLSX</span>
            <span id="exportXlsxSpinner" class="spinner-border spinner-border-sm ms-2 d-none" role="status"></span>
          </button>
        </div>
        <p class="small form-status justify-content-center mt-3 mb-0" id="exportStatus" aria-live="polite"></p>
      </div>
    </section>

    <section class="panel mt-3">
      <div class="panel-header">
        <h2>Export details</h2>
      </div>
      <div class="panel-body">
        <ul class="mb-0">
          <li class="mb-2">CSV: <code>GET /export-planning</code> (UTF-8 with BOM)</li>
          <li class="mb-0">Excel: <code>GET /export-xlsx</code></li>
        </ul>
      </div>
    </section>`;

  LeoniLayout.mount({
    pageId: "export",
    title: "Export",
    subtitle: "Download planning for reporting",
    contentHtml: content,
  });

  const exportStatus = document.getElementById("exportStatus");

  function setExportStatus(message, type = "") {
    exportStatus.textContent = message;
    exportStatus.className = `small form-status justify-content-center mt-3 mb-0 ${type ? `form-status-${type}` : ""}`.trim();
  }

  // Populate users select dropdown
  try {
    const users = await LeoniAPI.getUsers();
    const select = document.getElementById("exportUser");
    users
      .filter((u) => u.role === "Data Cleansing")
      .forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.name} (${u.matricule})`;
        select.appendChild(opt);
      });
  } catch (err) {
    console.error("Failed to populate users dropdown for export page", err);
  }

  function getExportParams() {
    const month = document.getElementById("exportMonth").value;
    const group_id = document.getElementById("exportGroup").value;
    const user_id = document.getElementById("exportUser").value;
    
    const params = {};
    if (month) params.month = month;
    if (group_id) params.group_id = group_id;
    if (user_id) params.user_id = user_id;
    return params;
  }

  async function downloadExport(fetchFn, filename) {
    const response = await fetchFn(getExportParams());
    if (!response.ok) {
      let message = "Export failed";
      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        // fallback
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function bindExport(btnId, labelId, spinnerId, fetchFn, filename, labelText) {
    const btn = document.getElementById(btnId);
    const label = document.getElementById(labelId);
    const spinner = document.getElementById(spinnerId);

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      label.textContent = "Preparing…";
      spinner.classList.remove("d-none");
      setExportStatus("");

      try {
        await downloadExport(fetchFn, filename);
        setExportStatus("Export completed successfully.", "success");
      } catch (err) {
        setExportStatus(err.message || "Unable to export planning data.", "error");
      } finally {
        btn.disabled = false;
        label.textContent = labelText;
        spinner.classList.add("d-none");
      }
    });
  }

  bindExport(
    "exportCsvBtn",
    "exportCsvLabel",
    "exportCsvSpinner",
    (filters) => LeoniAPI.exportPlanning(filters),
    "leoni-planning-export.csv",
    "Export CSV"
  );

  bindExport(
    "exportXlsxBtn",
    "exportXlsxLabel",
    "exportXlsxSpinner",
    (filters) => LeoniAPI.exportPlanningXlsx(filters),
    "leoni-planning-export.xlsx",
    "Export XLSX"
  );
})();
