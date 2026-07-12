(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;
  await LeoniAuth.refreshSession();

  const loggedUser = LeoniAuth.getUser();
  const HEARTBEAT_INTERVAL_MS = 60 * 1000;
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
  const ACTIVITY_RESUME_DELAY_MS = 800;

  let planningRowsCache = [];
  let workSessionSummary = null;
  let currentSession = null;
  let serverWorkDate = null;
  let trackingAvailableForServerDate = null;
  let heartbeatTimer = null;
  let displayTimer = null;
  let activityResumeTimer = null;
  let autoStartInFlight = false;
  let userEndedSession = false;
  let lastActivityAt = Date.now();
  let displayBaseSeconds = 0;
  let displayBaseAt = Date.now();

  const content = `
    <!-- GENERATE PLANNING SECTION -->
    <section class="panel mb-3">
      <div class="panel-header">
        <h2>Generate Home Office Calendar</h2>
      </div>
      <div class="panel-body">
        <div class="filter-bar">
          ${
            loggedUser.role === "Team Leader"
              ? `<div>
                   <label for="generateUser" class="form-label text-uppercase small fw-semibold opacity-75">Employee</label>
                   <select class="form-select form-field-lg" id="generateUser">
                     <option value="">Choose employee…</option>
                   </select>
                 </div>`
              : ""
          }
          <div>
            <label for="generateMonth" class="form-label text-uppercase small fw-semibold opacity-75">Month</label>
            <input type="month" class="form-control form-field-md" id="generateMonth" />
          </div>
          <button type="button" class="btn btn-leoni-primary" id="generatePlanningBtn">
            <i class="fa-solid fa-wand-magic-sparkles me-2"></i>Generate Planning
          </button>
          <span id="genStatus" class="small form-status" aria-live="polite"></span>
        </div>
      </div>
    </section>

    <!-- REMOTE WORK SESSION SECTION -->
    <section class="panel mb-3 work-session-panel" id="workSessionPanel">
      <div class="panel-header">
        <div>
          <h2>Remote Work Tracking</h2>
          <span class="text-muted small">Automatic tracking for today's remote planning row</span>
        </div>
        <span class="work-session-badge work-session-badge-idle" id="workSessionBadge">Checking</span>
      </div>
      <div class="panel-body">
        <div class="work-session-grid">
          <div>
            <div class="work-session-label">Remote tracking</div>
            <div class="work-session-time" id="workSessionState">Checking…</div>
          </div>
          <div>
            <div class="work-session-label">Worked today</div>
            <div class="work-session-hours" id="workSessionHours">00h 00min / 8h</div>
          </div>
          <div class="work-session-actions">
            <button type="button" class="btn btn-leoni-outline btn-leoni-danger-outline" id="endWorkBtn" disabled>
              <i class="fa-solid fa-stop me-2"></i>End Session
            </button>
          </div>
        </div>
        <p class="work-session-message" id="workSessionMessage">
          Checking today's remote planning availability…
        </p>
        <p class="work-session-privacy mb-0">
          This feature records only session status, timestamps, heartbeat, and accumulated time. It does not record screenshots, keystrokes, mouse coordinates, websites, apps, typed text, or personal activity.
        </p>
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
            <input type="month" class="form-control form-field-md" id="filterMonth" />
          </div>
          ${
            loggedUser.role === "Team Leader"
              ? `<div>
                   <label for="filterName" class="form-label">Name</label>
                   <input type="search" class="form-control form-field-md" id="filterName" placeholder="e.g. Ahmed" />
                 </div>
                 <div>
                   <label for="filterGroup" class="form-label">Group</label>
                   <select class="form-select form-field-sm" id="filterGroup">
                     <option value="">All groups</option>
                     <option value="1">Group A</option>
                     <option value="2">Group B</option>
                   </select>
                 </div>`
              : ""
          }
          <div class="filter-actions">
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
                <th>Work Hours</th>
                <th>Horaire</th>
              </tr>
            </thead>
            <tbody id="planningTableBody">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading planning…</td></tr>
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

  function toDateKey(value) {
    const raw = String(value || "");
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}min`;
  }

  function formatHours(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  }

  function getServerWorkDate() {
    return workSessionSummary?.server_date || workSessionSummary?.date || serverWorkDate || "";
  }

  function getServerRemotePlanningRow() {
    const summaryPlanning = workSessionSummary?.planning;
    if (
      summaryPlanning &&
      String(summaryPlanning.user_id) === String(loggedUser.id) &&
      summaryPlanning.status === "remote"
    ) {
      return summaryPlanning;
    }

    const key = getServerWorkDate();
    if (!key) return null;

    return planningRowsCache.find((row) =>
      String(row.user_id) === String(loggedUser.id) &&
      toDateKey(row.date) === key &&
      row.status === "remote"
    );
  }

  function summaryValue(summary, snakeKey, camelKey, fallback = 0) {
    return summary?.[snakeKey] ?? summary?.[camelKey] ?? fallback;
  }

  function syncServerWorkHourFromSummary() {
    const planning = workSessionSummary?.planning || getServerRemotePlanningRow();
    if (!planning || !workSessionSummary) return;
    const row = planningRowsCache.find((item) => String(item.id) === String(planning.id));
    if (!row) return;
    row.work_hour = summaryValue(workSessionSummary, "capped_hours", "cappedHours", row.work_hour);
    renderPlanning(planningRowsCache);
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

  function setGenerationStatus(message, type = "") {
    const statusEl = document.getElementById("genStatus");
    statusEl.textContent = message;
    statusEl.className = `small form-status ${type ? `form-status-${type}` : ""}`.trim();
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
            <td><span class="work-hour-value">${escapeHtml(formatHours(row.work_hour))}</span></td>
            <td>${escapeHtml(row.horaire || "—")}</td>
          </tr>`;
      })
      .join("");
  }

  function getLatestOpenSession(summary) {
    return (summary?.sessions || []).find((session) =>
      session.status === "active" || session.status === "paused"
    ) || null;
  }

  function updateTimerDisplay() {
    const hours = document.getElementById("workSessionHours");
    if (!hours) return;
    let seconds = summaryValue(workSessionSummary, "total_active_seconds", "totalActiveSeconds", 0);
    if (currentSession?.status === "active") {
      seconds = displayBaseSeconds + Math.floor((Date.now() - displayBaseAt) / 1000);
    }
    hours.textContent = `${formatDuration(Math.min(seconds, 8 * 60 * 60))} / 8h`;
  }

  function stopHeartbeatLoop() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (displayTimer) {
      clearInterval(displayTimer);
      displayTimer = null;
    }
  }

  function startHeartbeatLoop() {
    if (!currentSession || currentSession.status !== "active") {
      stopHeartbeatLoop();
      return;
    }
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(sendHeartbeatTick, HEARTBEAT_INTERVAL_MS);
    }
    if (!displayTimer) {
      displayTimer = setInterval(updateTimerDisplay, 1000);
    }
  }

  function renderWorkSessionPanel() {
    const planning = getServerRemotePlanningRow();
    const badge = document.getElementById("workSessionBadge");
    const state = document.getElementById("workSessionState");
    const message = document.getElementById("workSessionMessage");
    const endBtn = document.getElementById("endWorkBtn");

    if (!badge || !state || !message || !endBtn) return;

    const openSession = workSessionSummary?.current_active_session || getLatestOpenSession(workSessionSummary);
    currentSession = openSession;
    displayBaseSeconds = Number(summaryValue(workSessionSummary, "total_active_seconds", "totalActiveSeconds", 0));
    displayBaseAt = Date.now();

    const rawStatus = currentSession?.status || "idle";
    const hasRemotePlanning = Boolean(planning && trackingAvailableForServerDate !== false);
    const status = hasRemotePlanning ? rawStatus : "unavailable";
    const statusLabel =
      status === "active"
        ? "Active"
        : status === "paused"
          ? "Paused"
          : status === "unavailable"
            ? "Not available today"
          : status === "ended" || userEndedSession
            ? "Ended"
            : "Paused";

    badge.textContent = statusLabel;
    badge.className = `work-session-badge work-session-badge-${status}`;
    state.textContent = statusLabel;
    updateTimerDisplay();

    endBtn.disabled = !(status === "active" || status === "paused");

    if (!hasRemotePlanning) {
      message.textContent = "No valid remote planning row is available for the server work date.";
    } else if (status === "active") {
      message.textContent = "Remote tracking is active. Heartbeats are sent every 60 seconds while you remain active in the app.";
    } else if (status === "paused") {
      message.textContent = "Remote tracking is paused. It resumes automatically when you are active in the app again.";
    } else if (userEndedSession || status === "ended") {
      message.textContent = "Remote tracking is ended for this page session.";
    } else {
      message.textContent = "Remote planning is available. Tracking starts automatically while the page is open and active.";
    }

    startHeartbeatLoop();
  }

  async function loadWorkSessionSummary() {
    try {
      workSessionSummary = await LeoniAPI.getMyWorkSessions();
      serverWorkDate = workSessionSummary.server_date || workSessionSummary.date || serverWorkDate;
      trackingAvailableForServerDate = workSessionSummary.planning?.status === "remote";
      renderWorkSessionPanel();
    } catch (err) {
      workSessionSummary = null;
      renderWorkSessionPanel();
      LeoniLayout.toast({ type: "warning", message: err.message || "Unable to load work session summary." });
    }
  }

  async function initializeWorkTracking() {
    await loadWorkSessionSummary();
    if (document.visibilityState === "visible" && !userEndedSession) {
      await autoStartTracking({ silent: true });
    }
  }

  async function loadPlanning(options = {}) {
    const { refreshWorkSession = true } = options;
    LeoniLayout.showLoading(true);
    try {
      const rows = await LeoniAPI.getPlanning(getFilterParams());
      planningRowsCache = rows;
      renderPlanning(rows);
      if (refreshWorkSession) {
        await initializeWorkTracking();
      } else {
        renderWorkSessionPanel();
      }
    } catch {
      document.getElementById("planningTableBody").innerHTML = `
        <tr><td colspan="7" class="text-center py-4 text-danger">Failed to load planning data.</td></tr>`;
    } finally {
      LeoniLayout.showLoading(false);
    }
  }

  function applyWorkSessionResult(result) {
    const existingSessions = workSessionSummary?.sessions || [];
    const updatedSessions = result.session
      ? [
          result.session,
          ...existingSessions.filter((session) => String(session.id) !== String(result.session.id)),
        ]
      : existingSessions;
    const resultSummary = result.summary || {};
    serverWorkDate = result.server_date || resultSummary.server_date || resultSummary.date || serverWorkDate;
    if (Object.prototype.hasOwnProperty.call(result, "tracking_available")) {
      trackingAvailableForServerDate = result.tracking_available !== false;
    } else {
      const planning = result.planning || resultSummary.planning || workSessionSummary?.planning;
      trackingAvailableForServerDate = planning?.status === "remote";
    }
    const totalActiveSeconds = summaryValue(resultSummary, "total_active_seconds", "totalActiveSeconds", summaryValue(workSessionSummary, "total_active_seconds", "totalActiveSeconds", 0));
    const totalHours = summaryValue(resultSummary, "total_hours", "totalHours", summaryValue(workSessionSummary, "total_hours", "totalHours", 0));
    const cappedSeconds = summaryValue(resultSummary, "capped_seconds", "cappedSeconds", summaryValue(workSessionSummary, "capped_seconds", "cappedSeconds", 0));
    const cappedHours = summaryValue(resultSummary, "capped_hours", "cappedHours", summaryValue(workSessionSummary, "capped_hours", "cappedHours", 0));
    const mergedPlanning = result.tracking_available === false
      ? result.planning || resultSummary.planning || null
      : result.planning || resultSummary.planning || workSessionSummary?.planning || null;

    workSessionSummary = result.summary
      ? {
          ...workSessionSummary,
          ...resultSummary,
          date: resultSummary.date || workSessionSummary?.date || serverWorkDate,
          server_date: serverWorkDate,
          planning: mergedPlanning,
          sessions: updatedSessions,
          total_active_seconds: totalActiveSeconds,
          total_hours: totalHours,
          capped_seconds: cappedSeconds,
          capped_hours: cappedHours,
          totalActiveSeconds,
          totalHours,
          cappedSeconds,
          cappedHours,
          current_active_session: result.session?.status === "active" ? result.session : null,
        }
      : workSessionSummary;
    currentSession = result.tracking_available === false ? null : result.session || getLatestOpenSession(workSessionSummary);
    renderWorkSessionPanel();
    syncServerWorkHourFromSummary();
  }

  async function autoStartTracking(options = {}) {
    const { silent = false } = options;
    if (
      userEndedSession ||
      autoStartInFlight ||
      document.visibilityState !== "visible" ||
      trackingAvailableForServerDate === false
    ) {
      renderWorkSessionPanel();
      return;
    }

    autoStartInFlight = true;
    try {
      const result = await LeoniAPI.autoStartWorkSession();
      applyWorkSessionResult(result);
      if (result.tracking_available === false) {
        stopHeartbeatLoop();
      }
    } catch (err) {
      if (!silent) {
        LeoniLayout.toast({ type: "error", message: err.message || "Unable to activate remote tracking." });
      }
    } finally {
      autoStartInFlight = false;
    }
  }

  async function sendHeartbeatTick() {
    if (!currentSession || currentSession.status !== "active") return;

    const isActive = document.visibilityState === "visible" &&
      Date.now() - lastActivityAt < INACTIVITY_TIMEOUT_MS;

    if (!isActive) {
      await pauseCurrentSession({ automatic: true });
      return;
    }

    try {
      const result = await LeoniAPI.heartbeatWorkSession(currentSession.id, true);
      applyWorkSessionResult(result);
    } catch (err) {
      stopHeartbeatLoop();
      LeoniLayout.toast({ type: "error", message: err.message || "Heartbeat failed. Session may have expired." });
      await loadWorkSessionSummary();
    }
  }

  async function pauseCurrentSession(options = {}) {
    const { automatic = false, silent = false } = options;
    if (!currentSession || currentSession.status !== "active") return;
    try {
      const result = await LeoniAPI.pauseWorkSession(currentSession.id);
      applyWorkSessionResult(result);
      if (!silent && automatic) {
        LeoniLayout.toast({ type: "warning", message: "Remote tracking paused after inactivity." });
      }
    } catch (err) {
      if (!silent) {
        LeoniLayout.toast({ type: "error", message: err.message || "Unable to pause remote tracking." });
      }
    }
  }

  async function endCurrentSession() {
    if (!currentSession) return;
    userEndedSession = true;
    LeoniLayout.showLoading(true);
    try {
      const result = await LeoniAPI.endWorkSession(currentSession.id);
      applyWorkSessionResult(result);
      stopHeartbeatLoop();
      LeoniLayout.toast({ type: "success", message: "Remote work session ended." });
    } catch (err) {
      userEndedSession = false;
      LeoniLayout.toast({ type: "error", message: err.message || "Unable to end remote work session." });
    } finally {
      LeoniLayout.showLoading(false);
    }
  }

  function scheduleActivityResume() {
    if (
      userEndedSession ||
      activityResumeTimer ||
      autoStartInFlight ||
      document.visibilityState !== "visible" ||
      currentSession?.status === "active" ||
      trackingAvailableForServerDate === false
    ) {
      return;
    }

    activityResumeTimer = setTimeout(async () => {
      activityResumeTimer = null;
      if (!userEndedSession && currentSession?.status !== "active") {
        await autoStartTracking({ silent: true });
      }
    }, ACTIVITY_RESUME_DELAY_MS);
  }

  function markActivity(event) {
    lastActivityAt = Date.now();
    if (event?.target?.closest?.("#endWorkBtn")) return;
    scheduleActivityResume();
  }

  ["mousemove", "keydown", "click", "scroll", "touchstart", "focus"].forEach((eventName) => {
    window.addEventListener(eventName, markActivity, { passive: true });
  });

  document.getElementById("endWorkBtn").addEventListener("click", endCurrentSession);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      markActivity();
      autoStartTracking({ silent: true });
      return;
    }
    if (currentSession?.status === "active") {
      pauseCurrentSession({ automatic: true, silent: true });
    }
  });

  window.addEventListener("pagehide", () => {
    if (currentSession?.status === "active") {
      LeoniAPI.pauseWorkSessionBeacon(currentSession.id);
    }
    stopHeartbeatLoop();
  });

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
    setGenerationStatus("");

    if (!monthInput) {
      setGenerationStatus("Please select a month.", "warning");
      return;
    }

    let targetUserId = loggedUser.id;
    if (loggedUser.role === "Team Leader") {
      const selectVal = document.getElementById("generateUser").value;
      if (!selectVal) {
        setGenerationStatus("Please select an employee.", "warning");
        return;
      }
      targetUserId = selectVal;
    }

    LeoniLayout.showLoading(true);
    try {
      const res = await LeoniAPI.generatePlanning(targetUserId, monthInput);
      setGenerationStatus(res.message || "Planning generated successfully!", "success");
      // Reload planning view
      await loadPlanning();
    } catch (err) {
      setGenerationStatus(err.message || "Failed to generate planning.", "error");
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
