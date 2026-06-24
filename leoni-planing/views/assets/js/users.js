(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;
  await LeoniAuth.refreshSession();

  const loggedUser = LeoniAuth.getUser();

  const content = `
    <section class="panel">
      <div class="panel-header d-flex align-items-center justify-content-between">
        <div>
          <h2>All users</h2>
          <span class="text-muted small" id="usersCount"></span>
        </div>
        ${
          loggedUser.role === "Team Leader"
            ? `<button type="button" class="btn btn-sm btn-leoni-primary" id="openCreateModalBtn">
                 <i class="fa-solid fa-user-plus me-1"></i>Add User
               </button>`
            : ""
        }
      </div>
      <div class="panel-body p-0">
        <div class="table-responsive">
          <table class="table table-leoni table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Matricule</th>
                <th>Email</th>
                <th>Role</th>
                <th>Group</th>
                <th>Department</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              <tr><td colspan="8" class="text-center py-4 text-muted">Loading users…</td></tr>
            </tbody>
          </table>
        </div>
        <div id="usersEmpty" class="empty-state d-none">
          <div><i class="fa-solid fa-users"></i></div>
          <p class="mb-0">No users found. Register users to populate this list.</p>
        </div>
      </div>
    </section>

    <!-- CREATE USER MODAL -->
    <div class="modal fade" id="createUserModal" tabindex="-1" aria-labelledby="createUserModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius: 10px;">
          <div class="modal-header">
            <h5 class="modal-title" id="createUserModalLabel">Register New User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="createAlert" class="alert alert-danger d-none"></div>
            <form id="createUserForm">
              <div class="row">
                <div class="col-6 mb-3">
                  <label for="createFirstName" class="form-label">First Name</label>
                  <input type="text" class="form-control" id="createFirstName" required />
                </div>
                <div class="col-6 mb-3">
                  <label for="createLastName" class="form-label">Last Name</label>
                  <input type="text" class="form-control" id="createLastName" required />
                </div>
              </div>
              <div class="mb-3">
                <label for="createUsername" class="form-label">Username</label>
                <input type="text" class="form-control" id="createUsername" required />
              </div>
              <div class="mb-3">
                <label for="createEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="createEmail" required />
              </div>
              <div class="mb-3">
                <label for="createPassword" class="form-label">Temporary Password</label>
                <input type="password" class="form-control" id="createPassword" minlength="8" required />
              </div>
              <div class="mb-3">
                <label for="createMatricule" class="form-label">Matricule</label>
                <input type="text" class="form-control" id="createMatricule" required />
              </div>
              <div class="mb-3">
                <label for="createDepartment" class="form-label">Department</label>
                <input type="text" class="form-control" id="createDepartment" required />
              </div>
              <div class="mb-0">
                <label for="createRole" class="form-label">Role</label>
                <select class="form-select" id="createRole">
                  <option value="Data Cleansing">Data Cleansing</option>
                  <option value="Team Leader">Team Leader</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-leoni-outline" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-leoni-primary" id="saveCreateBtn">Create User</button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT USER MODAL -->
    <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius: 10px;">
          <div class="modal-header">
            <h5 class="modal-title" id="editUserModalLabel">Edit User Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="editAlert" class="alert alert-danger d-none"></div>
            <input type="hidden" id="editUserId" />
            <div class="row">
              <div class="col-6 mb-3">
                <label for="editFirstName" class="form-label">First Name</label>
                <input type="text" class="form-control" id="editFirstName" required />
              </div>
              <div class="col-6 mb-3">
                <label for="editLastName" class="form-label">Last Name</label>
                <input type="text" class="form-control" id="editLastName" required />
              </div>
            </div>
            <div class="mb-3">
              <label for="editMatricule" class="form-label">Matricule</label>
              <input type="text" class="form-control" id="editMatricule" required />
            </div>
            <div class="mb-3">
              <label for="editDepartment" class="form-label">Department</label>
              <input type="text" class="form-control" id="editDepartment" required />
            </div>
            <div class="mb-3">
              <label for="editRole" class="form-label">Role</label>
              <select class="form-select" id="editRole">
                <option value="Data Cleansing">Data Cleansing</option>
                <option value="Team Leader">Team Leader</option>
              </select>
            </div>
            <div class="mb-0">
              <label for="editGroup" class="form-label">Home Office Group</label>
              <select class="form-select" id="editGroup">
                <option value="">No Group</option>
                <option value="1">Group A</option>
                <option value="2">Group B</option>
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
  const createModal = new bootstrap.Modal(document.getElementById("createUserModal"));

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
            <td>${escapeHtml(user.username)}</td>
            <td><code>${escapeHtml(user.matricule)}</code></td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge-role">${escapeHtml(user.role)}</span></td>
            <td><span class="badge-group ${badgeClass}">Group ${group}</span></td>
            <td>${escapeHtml(user.department || "—")}</td>
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

  // Open User Creation Modal
  const openBtn = document.getElementById("openCreateModalBtn");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      document.getElementById("createAlert").classList.add("d-none");
      document.getElementById("createUserForm").reset();
      createModal.show();
    });
  }

  // Save Created User
  document.getElementById("saveCreateBtn")?.addEventListener("click", async () => {
    const first_name = document.getElementById("createFirstName").value.trim();
    const last_name = document.getElementById("createLastName").value.trim();
    const username = document.getElementById("createUsername").value.trim();
    const email = document.getElementById("createEmail").value.trim();
    const password = document.getElementById("createPassword").value;
    const matricule = document.getElementById("createMatricule").value.trim();
    const department = document.getElementById("createDepartment").value.trim();
    const role = document.getElementById("createRole").value;

    const alertEl = document.getElementById("createAlert");
    alertEl.classList.add("d-none");

    if (!first_name || !last_name || !username || !email || !password || !matricule || !department) {
      alertEl.textContent = "Please fill in all required fields.";
      alertEl.classList.remove("d-none");
      return;
    }

    if (password.length < 8) {
      alertEl.textContent = "Password must be at least 8 characters.";
      alertEl.classList.remove("d-none");
      return;
    }

    LeoniLayout.showLoading(true);
    try {
      await LeoniAPI.createUser({
        first_name,
        last_name,
        username,
        email,
        password,
        matricule,
        department,
        role,
      });
      createModal.hide();
      // Reload users list
      usersCache = await LeoniAPI.getUsers();
      renderUsers(usersCache);
    } catch (err) {
      alertEl.textContent = err.message || "Failed to create user.";
      alertEl.classList.remove("d-none");
    } finally {
      LeoniLayout.showLoading(false);
    }
  });

  // Table Edit/Delete Clicks
  document.getElementById("usersTableBody").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const user = usersCache.find((u) => String(u.id) === String(id));
    if (!user) return;

    if (btn.dataset.action === "edit") {
      document.getElementById("editAlert").classList.add("d-none");
      document.getElementById("editUserId").value = user.id;
      document.getElementById("editFirstName").value = user.first_name || "";
      document.getElementById("editLastName").value = user.last_name || "";
      document.getElementById("editMatricule").value = user.matricule || "";
      document.getElementById("editDepartment").value = user.department || "";
      document.getElementById("editRole").value = user.role;
      document.getElementById("editGroup").value = user.group_id != null ? String(user.group_id) : "";
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

  // Save Edited User
  document.getElementById("saveUserBtn").addEventListener("click", async () => {
    const id = document.getElementById("editUserId").value;
    const first_name = document.getElementById("editFirstName").value.trim();
    const last_name = document.getElementById("editLastName").value.trim();
    const matricule = document.getElementById("editMatricule").value.trim();
    const department = document.getElementById("editDepartment").value.trim();
    const role = document.getElementById("editRole").value;
    const group_id = document.getElementById("editGroup").value;

    const alertEl = document.getElementById("editAlert");
    alertEl.classList.add("d-none");

    if (!first_name || !last_name || !matricule || !department) {
      alertEl.textContent = "Please fill in all fields.";
      alertEl.classList.remove("d-none");
      return;
    }

    LeoniLayout.showLoading(true);
    try {
      await LeoniAPI.updateUser(id, {
        first_name,
        last_name,
        role,
        matricule,
        department,
        group_id,
      });
      editModal.hide();
      // Reload users list
      usersCache = await LeoniAPI.getUsers();
      renderUsers(usersCache);
    } catch (err) {
      alertEl.textContent = err.message || "Failed to update user.";
      alertEl.classList.remove("d-none");
    } finally {
      LeoniLayout.showLoading(false);
    }
  });

  // Initial Load
  LeoniLayout.showLoading(true);
  try {
    usersCache = await LeoniAPI.getUsers();
    renderUsers(usersCache);
  } catch {
    document.getElementById("usersTableBody").innerHTML = `
      <tr><td colspan="8" class="text-center py-4 text-danger">Failed to load users.</td></tr>`;
  } finally {
    LeoniLayout.showLoading(false);
  }
})();
