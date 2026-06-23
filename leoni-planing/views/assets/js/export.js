if (!LeoniAuth.requireAuth()) {
  // redirecting
} else {
  const content = `
    <section class="panel">
      <div class="panel-body export-hero">
        <div class="export-hero-icon">
          <i class="fa-solid fa-file-excel"></i>
        </div>
        <h2 class="h4 mb-2">Export planning data</h2>
        <p class="text-muted mb-4 mx-auto" style="max-width: 520px;">
          Download the complete planning schedule as an Excel-compatible CSV file.
          The export includes employee details, group assignment, office days, and status.
        </p>
        <button type="button" class="btn btn-lg btn-leoni-primary px-4" id="exportBtn">
          <i class="fa-solid fa-file-export me-2"></i>
          <span id="exportBtnLabel">Export Planning</span>
          <span id="exportBtnSpinner" class="spinner-border spinner-border-sm ms-2 d-none" role="status"></span>
        </button>
        <p class="small text-muted mt-3 mb-0" id="exportStatus"></p>
      </div>
    </section>

    <section class="panel mt-3">
      <div class="panel-header">
        <h2>Export details</h2>
      </div>
      <div class="panel-body">
        <ul class="mb-0">
          <li class="mb-2">Format: CSV (opens directly in Microsoft Excel)</li>
          <li class="mb-2">Endpoint: <code>GET /export-planning</code></li>
          <li class="mb-0">Encoding: UTF-8 with BOM for special characters</li>
        </ul>
      </div>
    </section>`;

  LeoniLayout.mount({
    pageId: "export",
    title: "Export",
    subtitle: "Download planning for reporting",
    contentHtml: content,
  });

  const exportBtn = document.getElementById("exportBtn");
  const exportBtnLabel = document.getElementById("exportBtnLabel");
  const exportBtnSpinner = document.getElementById("exportBtnSpinner");
  const exportStatus = document.getElementById("exportStatus");

  exportBtn.addEventListener("click", async () => {
    exportBtn.disabled = true;
    exportBtnLabel.textContent = "Preparing export…";
    exportBtnSpinner.classList.remove("d-none");
    exportStatus.textContent = "";

    try {
      const response = await LeoniAPI.exportPlanning();
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "leoni-planning-export.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      exportStatus.textContent = "Export completed successfully.";
    } catch (err) {
      exportStatus.textContent = err.message || "Unable to export planning data.";
      exportStatus.style.color = "var(--leoni-rouge)";
    } finally {
      exportBtn.disabled = false;
      exportBtnLabel.textContent = "Export Planning";
      exportBtnSpinner.classList.add("d-none");
    }
  });
}
