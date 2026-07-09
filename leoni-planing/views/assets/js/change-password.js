(async () => {
  const ok = await LeoniAuth.ensureAccess({ allowPasswordChange: true });
  if (!ok) return;

  const user = LeoniAuth.getUser();
  const headerSubtitle = document.querySelector(".login-card-header p");
  if (headerSubtitle && user && !(user.first_login || user.must_change_password)) {
    headerSubtitle.textContent = "Update your account password";
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
    submitBtnText.textContent = "Updating…";
    submitBtnSpinner.classList.remove("d-none");

    try {
      const data = await LeoniAPI.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      await LeoniAuth.refreshSession();
      window.location.href = data.redirect || "/dashboard";
    } catch (err) {
      alertEl.textContent = err.message || "Unable to change password.";
      alertEl.classList.remove("d-none");
    } finally {
      submitBtn.disabled = false;
      submitBtnText.textContent = "Update password";
      submitBtnSpinner.classList.add("d-none");
    }
  });
})();
