if (!LeoniAuth.requireAuth()) {
  // redirecting
} else {
  const content = `
    <section class="panel">
      <div class="panel-header">
        <h2>All users</h2>
        <span class="text-muted small" id="usersCount"></span>
      </div>
      <div class="panel-body p-0">
        <div class="table-responsive">
          <table class="table table-leoni table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Group</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              <tr><td colspan="5" class="text-center py-4 text-muted">Loading users…</td></tr>
            </tbody>
          </table>
        </div>
        <div id="usersEmpty" class="empty-state d-none">
          <div><i class="fa-solid fa-users"></i></div>
          <p class="mb-0">No users found. Register users via the API to populate this list.</p>
        </div>
      </div>
    </section>

    <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius: 10px;">
          <div class="modal-header">
            <h5 class="modal-title" id="editUserModalLabel">Edit user</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="editUserId" />
            <div class="mb-3">
              <label for="editUserName" class="form-label">Name</label>
              <input type="text" class="form-control" id="editUserName" required />
            </div>
            <div class="mb-0">
              <label for="editUserRole" class="form-label">Role</label>
              <select class="form-select" id="editUserRole">
                <option value="employee">employee</option>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-leoni-outline" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-leoni-primary" id="saveUserBtn">Save changes</button>
          </div>
        </div>
      </div>
    </div>`;

  LeoniLayout.mount({
    pageId: "users",
    title: "Users",
    subtitle: "Employee directory and roles",
    contentHtml: content,
  });

  let usersCache = [];
  const editModal = new bootstrap.Modal(document.getElementById("editUserModal"));

  function renderUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    const empty = document.getElementById("usersEmpty");
    document.getElementById("usersCount").textContent = `${users.length} user(s)`;

    if (!users.length) {
      tbody.innerHTML = "";
      empty.classList.remove("d-none");
      return;
    }

    empty.classList.add("d-none");
    tbody.innerHTML = users
      .map((user) => {
        const group = LeoniLayout.formatGroup(user.group_id);
        const badgeClass = LeoniLayout.groupBadgeClass(user.group_id);
        return `
          <tr>
            <td class="fw-semibold">${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge-role">${escapeHtml(user.role || "employee")}</span></td>
            <td><span class="badge-group ${badgeClass}">Group ${group}</span></td>
            <td class="text-end">
              <button type="button" class="btn btn-sm btn-leoni-outline me-1" data-action="edit" data-id="${user.id}">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="btn btn-sm btn-leoni-outline btn-leoni-danger-outline" data-action="delete" data-id="${user.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>`;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.getElementById("usersTableBody").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const user = usersCache.find((u) => String(u.id) === String(id));
    if (!user) return;

    if (btn.dataset.action === "edit") {
      document.getElementById("editUserId").value = user.id;
      document.getElementById("editUserName").value = user.name;
      document.getElementById("editUserRole").value = user.role || "employee";
      editModal.show();
    }

    if (btn.dataset.action === "delete") {
      const confirmed = window.confirm(`Delete user "${user.name}"? This action cannot be undone.`);
      if (!confirmed) return;
      LeoniLayout.showLoading(true);
      try {
        await LeoniAPI.deleteUser(user.id);
        usersCache = usersCache.filter((u) => String(u.id) !== String(id));
        renderUsers(usersCache);
      } catch (err) {
        alert(err.message || "Failed to delete user.");
      } finally {
        LeoniLayout.showLoading(false);
      }
    }
  });

  document.getElementById("saveUserBtn").addEventListener("click", async () => {
    const id = document.getElementById("editUserId").value;
    const name = document.getElementById("editUserName").value.trim();
    const role = document.getElementById("editUserRole").value;
    if (!name) return;

    LeoniLayout.showLoading(true);
    try {
      await LeoniAPI.updateUser(id, { name, role });
      usersCache = usersCache.map((u) =>
        String(u.id) === String(id) ? { ...u, name, role } : u
      );
      renderUsers(usersCache);
      editModal.hide();
    } catch (err) {
      alert(err.message || "Failed to update user.");
    } finally {
      LeoniLayout.showLoading(false);
    }
  });

  (async () => {
    LeoniLayout.showLoading(true);
    try {
      usersCache = await LeoniAPI.getUsers();
      renderUsers(usersCache);
    } catch {
      document.getElementById("usersTableBody").innerHTML = `
        <tr><td colspan="5" class="text-center py-4 text-danger">Failed to load users.</td></tr>`;
    } finally {
      LeoniLayout.showLoading(false);
    }
  })();
}
