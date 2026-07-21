(async () => {
  const ok = await LeoniAuth.ensureAccess({ allowPasswordChange: true });
  if (!ok) return;

  const user = LeoniAuth.getUser();
  const passwordChangeRequired = LeoniAuth.requiresPasswordChange(user);
  const reason = new URLSearchParams(window.location.search).get("reason");

  const content = `
    <div class="row justify-content-center">
      <div class="col-lg-7 col-xl-5">
        ${
          passwordChangeRequired
            ? `<div class="alert alert-warning alert-leoni mb-3" role="alert">
                 ${LeoniLayout.escapeHtml(LeoniAuth.passwordChangeRequiredMessage)}
               </div>`
            : ""
        }
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Change your password</h2>
              <span class="text-muted small">
                ${
                  passwordChangeRequired
                    ? "Required on first login for security"
                    : "Update your account password"
                }
              </span>
            </div>
          </div>
          <div class="panel-body">
            <div id="pwdAlert" class="alert alert-danger alert-leoni d-none" role="alert"></div>
            <form id="changePasswordForm" novalidate>
              <div class="mb-3">
                <label for="oldPassword" class="form-label">Current password</label>
                <input type="password" class="form-control" id="oldPassword" required autocomplete="current-password" />
              </div>
              <div class="mb-3">
                <label for="newPassword" class="form-label">New password</label>
                <input type="password" class="form-control" id="newPassword" required minlength="8" autocomplete="new-password" />
              </div>
              <div class="mb-4">
                <label for="confirmPassword" class="form-label">Confirm new password</label>
                <input type="password" class="form-control" id="confirmPassword" required minlength="8" autocomplete="new-password" />
              </div>
              <button type="submit" class="btn btn-leoni-primary" id="submitBtn">
                <span id="submitBtnText">Update password</span>
                <span id="submitBtnSpinner" class="spinner-border spinner-border-sm ms-2 d-none" role="status"></span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>`;

  LeoniLayout.mount({
    pageId: "change-password",
    title: "Change Password",
    subtitle: passwordChangeRequired
      ? "Temporary password update required"
      : "Security settings",
    contentHtml: content,
  });

  if (passwordChangeRequired && reason === "password-required") {
    LeoniLayout.toast({
      type: "warning",
      message: LeoniAuth.passwordChangeRequiredMessage,
    });
  }

  const form = document.getElementById("changePasswordForm");
  const alertEl = document.getElementById("pwdAlert");
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnText = document.getElementById("submitBtnText");
  const submitBtnSpinner = document.getElementById("submitBtnSpinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertEl.classList.add("d-none");

    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alertEl.textContent = "New password and confirmation do not match.";
      alertEl.classList.remove("d-none");
      return;
    }

    submitBtn.disabled = true;
    submitBtnText.textContent = "Updating...";
    submitBtnSpinner.classList.remove("d-none");
    LeoniLayout.showLoading(true);

    try {
      const data = await LeoniAPI.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      await LeoniAuth.refreshSession();
      LeoniLayout.toast({
        type: "success",
        message: "Password updated successfully.",
      });

      window.setTimeout(() => {
        window.location.href = data.redirect || "/dashboard";
      }, 700);
    } catch (err) {
      alertEl.textContent = err.message || "Unable to change password.";
      alertEl.classList.remove("d-none");
      submitBtn.disabled = false;
      submitBtnText.textContent = "Update password";
      submitBtnSpinner.classList.add("d-none");
      LeoniLayout.showLoading(false);
    }
  });
})();
