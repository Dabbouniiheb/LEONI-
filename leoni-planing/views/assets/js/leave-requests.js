(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;
  await LeoniAuth.refreshSession();

  const loggedUser = LeoniAuth.getUser();
  const canManageLeaveRequests = LeoniAuth.hasPermission("leave_requests.manage");

  const content = `
    <section class="panel mb-3">
      <div class="panel-header">
        <h2>Nouvelle demande</h2>
      </div>
      <div class="panel-body">
        <div id="leaveFormAlert" class="alert alert-danger alert-leoni d-none"></div>
        <form id="leaveRequestForm" class="leave-form-grid">
          <div>
            <label for="leaveStartDate" class="form-label">Start date</label>
            <input type="date" class="form-control" id="leaveStartDate" required />
          </div>
          <div>
            <label for="leaveEndDate" class="form-label">End date</label>
            <input type="date" class="form-control" id="leaveEndDate" required />
          </div>
          <div>
            <label for="leaveType" class="form-label">Leave type</label>
            <select class="form-select" id="leaveType" required>
              <option value="">Choose type</option>
              <option value="annual">Annual leave</option>
              <option value="sick">Sick leave</option>
              <option value="exceptional">Exceptional leave</option>
              <option value="unpaid">Unpaid leave</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="leave-form-reason">
            <label for="leaveReason" class="form-label">Reason or comment</label>
            <textarea class="form-control" id="leaveReason" rows="3" maxlength="500"></textarea>
          </div>
          <div class="leave-form-actions">
            <button type="submit" class="btn btn-leoni-primary">
              <i class="fa-solid fa-paper-plane me-2"></i>Submit request
            </button>
          </div>
        </form>
      </div>
    </section>

    <section class="panel mb-3">
      <div class="panel-header">
        <div>
          <h2>My leave requests</h2>
          <span class="text-muted small" id="ownLeaveCount"></span>
        </div>
      </div>
      <div class="panel-body p-0">
        <div class="table-responsive">
          <table class="table table-leoni table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Period</th>
                <th>Type</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Reviewed</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="ownLeaveTableBody">
              <tr><td colspan="6" class="text-center py-4 text-muted">Loading requests...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="ownLeaveEmpty" class="empty-state d-none">
          <div><i class="fa-solid fa-calendar-plus"></i></div>
          <p class="mb-0">No leave requests submitted yet.</p>
        </div>
      </div>
    </section>

    ${
      canManageLeaveRequests
        ? `<section class="panel">
             <div class="panel-header">
               <div>
                 <h2>All leave requests</h2>
                 <span class="text-muted small" id="allLeaveCount"></span>
               </div>
             </div>
             <div class="panel-body p-0">
               <div class="table-responsive">
                 <table class="table table-leoni table-hover align-middle mb-0">
                   <thead>
                     <tr>
                       <th>Employee</th>
                       <th>Period</th>
                       <th>Type</th>
                       <th>Status</th>
                       <th>Reason</th>
                       <th>Reviewed</th>
                       <th class="text-end leave-actions-column">Actions</th>
                     </tr>
                   </thead>
                   <tbody id="allLeaveTableBody">
                     <tr><td colspan="7" class="text-center py-4 text-muted">Loading requests...</td></tr>
                   </tbody>
                 </table>
               </div>
               <div id="allLeaveEmpty" class="empty-state d-none">
                 <div><i class="fa-solid fa-inbox"></i></div>
                 <p class="mb-0">No leave requests found.</p>
               </div>
             </div>
           </section>

           <div class="modal fade" id="reviewLeaveModal" tabindex="-1" aria-labelledby="reviewLeaveModalLabel" aria-hidden="true">
             <div class="modal-dialog modal-dialog-centered">
               <div class="modal-content leave-review-modal">
                 <div class="modal-header">
                   <h5 class="modal-title" id="reviewLeaveModalLabel">Review leave request</h5>
                   <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                 </div>
                 <div class="modal-body">
                   <div id="reviewLeaveAlert" class="alert alert-danger alert-leoni d-none"></div>
                   <input type="hidden" id="reviewLeaveId" />
                   <input type="hidden" id="reviewLeaveAction" />
                   <label for="reviewDecisionComment" class="form-label">Decision comment</label>
                   <textarea class="form-control" id="reviewDecisionComment" rows="4" maxlength="500"></textarea>
                 </div>
                 <div class="modal-footer">
                   <button type="button" class="btn btn-leoni-outline" data-bs-dismiss="modal">Cancel</button>
                   <button type="button" class="btn btn-leoni-primary" id="confirmReviewLeaveBtn">Confirm</button>
                 </div>
               </div>
             </div>
           </div>`
        : ""
    }`;

  LeoniLayout.mount({
    pageId: "leave-requests",
    title: "Demande de congé",
    subtitle: "Submit and track leave requests",
    contentHtml: content,
  });

  const esc = LeoniLayout.escapeHtml;
  const statusLabels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };
  const typeLabels = {
    annual: "Annual leave",
    sick: "Sick leave",
    exceptional: "Exceptional leave",
    unpaid: "Unpaid leave",
    other: "Other",
  };
  const validStatuses = Object.keys(statusLabels);

  let ownRequests = [];
  let allRequests = [];
  const reviewModalEl = document.getElementById("reviewLeaveModal");
  const reviewModal = reviewModalEl ? new bootstrap.Modal(reviewModalEl) : null;

  function formatDate(dateStr) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
    if (!match) return String(dateStr || "-");
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatPeriod(request) {
    return `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`;
  }

  function statusBadge(status) {
    const normalized = validStatuses.includes(status) ? status : "pending";
    return `<span class="leave-status leave-status-${normalized}">${esc(statusLabels[normalized])}</span>`;
  }

  function reviewedText(request) {
    if (!request.reviewed_at) return "-";
    const reviewer = request.reviewer_name ? ` by ${request.reviewer_name}` : "";
    return `${request.reviewed_at}${reviewer}`;
  }

  function actionButtons(request, scope) {
    if (scope === "own" && request.status === "pending") {
      return `
        <button type="button" class="btn btn-sm btn-leoni-outline btn-leoni-danger-outline" data-action="cancel" data-id="${Number(request.id)}">
          <i class="fa-solid fa-ban me-1"></i>Cancel
        </button>`;
    }

    if (scope === "all" && request.status === "pending") {
      if (String(request.user_id) === String(loggedUser.id)) {
        return `<span class="text-muted small">Own request</span>`;
      }
      return `
        <div class="leave-actions">
          <button type="button" class="btn btn-leoni-outline leave-action-btn leave-action-btn-approve" data-action="approve" data-id="${Number(request.id)}" aria-label="Approve leave request" title="Approve">
            <i class="fa-solid fa-check" aria-hidden="true"></i>
            <span class="visually-hidden">Approve</span>
          </button>
          <button type="button" class="btn btn-leoni-outline btn-leoni-danger-outline leave-action-btn leave-action-btn-reject" data-action="reject" data-id="${Number(request.id)}" aria-label="Reject leave request" title="Reject">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            <span class="visually-hidden">Reject</span>
          </button>
        </div>`;
    }

    return `<span class="text-muted small">No action</span>`;
  }

  function requestRow(request, scope) {
    const reason = request.reason || "-";
    const decision = request.decision_comment ? `<div class="decision-comment-text">${esc(request.decision_comment)}</div>` : "";
    const employeeCell = scope === "all"
      ? `<td>
           <div class="fw-semibold">${esc(request.user_name || `User #${request.user_id}`)}</div>
           <div class="text-muted small">${esc(request.matricule || "")}</div>
         </td>`
      : "";

    return `
      <tr>
        ${employeeCell}
        <td class="fw-semibold">${esc(formatPeriod(request))}</td>
        <td>${esc(typeLabels[request.leave_type] || request.leave_type || "-")}</td>
        <td>${statusBadge(request.status)}</td>
        <td class="leave-reason-cell">${esc(reason)}</td>
        <td>
          <div>${esc(reviewedText(request))}</div>
          ${decision}
        </td>
        <td class="text-end leave-actions-column">${actionButtons(request, scope)}</td>
      </tr>`;
  }

  function renderOwnRequests() {
    const tbody = document.getElementById("ownLeaveTableBody");
    const empty = document.getElementById("ownLeaveEmpty");
    document.getElementById("ownLeaveCount").textContent =
      `${ownRequests.length} request${ownRequests.length === 1 ? "" : "s"}`;

    if (!ownRequests.length) {
      tbody.innerHTML = "";
      empty.classList.remove("d-none");
      return;
    }

    empty.classList.add("d-none");
    tbody.innerHTML = ownRequests.map((request) => requestRow(request, "own")).join("");
  }

  function renderAllRequests() {
    if (!canManageLeaveRequests) return;
    const tbody = document.getElementById("allLeaveTableBody");
    const empty = document.getElementById("allLeaveEmpty");
    document.getElementById("allLeaveCount").textContent =
      `${allRequests.length} request${allRequests.length === 1 ? "" : "s"}`;

    if (!allRequests.length) {
      tbody.innerHTML = "";
      empty.classList.remove("d-none");
      return;
    }

    empty.classList.add("d-none");
    tbody.innerHTML = allRequests.map((request) => requestRow(request, "all")).join("");
  }

  async function loadRequests() {
    LeoniLayout.showLoading(true);
    try {
      ownRequests = await LeoniAPI.getOwnLeaveRequests();
      renderOwnRequests();

      if (canManageLeaveRequests) {
        allRequests = await LeoniAPI.getAllLeaveRequests();
        renderAllRequests();
      }
    } catch (err) {
      LeoniLayout.toast({ type: "error", message: err.message || "Failed to load leave requests." });
    } finally {
      LeoniLayout.showLoading(false);
    }
  }

  function showFormAlert(message) {
    const alert = document.getElementById("leaveFormAlert");
    alert.textContent = message;
    alert.classList.remove("d-none");
  }

  document.getElementById("leaveRequestForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const alert = document.getElementById("leaveFormAlert");
    alert.classList.add("d-none");

    const startDate = document.getElementById("leaveStartDate").value;
    const endDate = document.getElementById("leaveEndDate").value;
    const leaveType = document.getElementById("leaveType").value;
    const reason = document.getElementById("leaveReason").value.trim();

    if (!startDate || !endDate || !leaveType) {
      showFormAlert("Please fill in all required fields.");
      return;
    }
    if (startDate > endDate) {
      showFormAlert("End date must be after or equal to start date.");
      return;
    }

    LeoniLayout.showLoading(true);
    try {
      await LeoniAPI.createLeaveRequest({
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        reason,
      });
      event.target.reset();
      LeoniLayout.toast({ type: "success", message: "Leave request submitted successfully" });
      await loadRequests();
    } catch (err) {
      showFormAlert(err.message || "Failed to submit leave request.");
    } finally {
      LeoniLayout.showLoading(false);
    }
  });

  document.getElementById("ownLeaveTableBody").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action='cancel']");
    if (!button) return;

    const confirmed = await LeoniLayout.confirm({
      title: "Cancel request",
      message: "Are you sure you want to cancel this pending leave request?",
      confirmText: "Cancel request",
      danger: true,
    });
    if (!confirmed) return;

    LeoniLayout.showLoading(true);
    try {
      await LeoniAPI.cancelLeaveRequest(button.dataset.id);
      LeoniLayout.toast({ type: "success", message: "Leave request cancelled successfully" });
      await loadRequests();
    } catch (err) {
      LeoniLayout.toast({ type: "error", message: err.message || "Failed to cancel leave request." });
    } finally {
      LeoniLayout.showLoading(false);
    }
  });

  if (canManageLeaveRequests) {
    document.getElementById("allLeaveTableBody").addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      if (action !== "approve" && action !== "reject") return;

      document.getElementById("reviewLeaveId").value = button.dataset.id;
      document.getElementById("reviewLeaveAction").value = action;
      document.getElementById("reviewDecisionComment").value = "";
      document.getElementById("reviewLeaveAlert").classList.add("d-none");
      document.getElementById("reviewLeaveModalLabel").textContent =
        action === "approve" ? "Approve leave request" : "Reject leave request";

      const confirmButton = document.getElementById("confirmReviewLeaveBtn");
      confirmButton.textContent = action === "approve" ? "Approve" : "Reject";
      confirmButton.classList.toggle("btn-leoni-danger", action === "reject");
      confirmButton.classList.toggle("btn-leoni-primary", action !== "reject");

      reviewModal.show();
    });

    document.getElementById("confirmReviewLeaveBtn").addEventListener("click", async () => {
      const id = document.getElementById("reviewLeaveId").value;
      const action = document.getElementById("reviewLeaveAction").value;
      const decision_comment = document.getElementById("reviewDecisionComment").value.trim();
      const alert = document.getElementById("reviewLeaveAlert");
      alert.classList.add("d-none");

      LeoniLayout.showLoading(true);
      try {
        if (action === "approve") {
          await LeoniAPI.approveLeaveRequest(id, { decision_comment });
        } else {
          await LeoniAPI.rejectLeaveRequest(id, { decision_comment });
        }
        reviewModal.hide();
        LeoniLayout.toast({
          type: "success",
          message: action === "approve" ? "Leave request approved" : "Leave request rejected",
        });
        await loadRequests();
      } catch (err) {
        alert.textContent = err.message || "Failed to review leave request.";
        alert.classList.remove("d-none");
      } finally {
        LeoniLayout.showLoading(false);
      }
    });
  }

  await loadRequests();
})();
