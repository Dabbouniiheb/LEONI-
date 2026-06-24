(async () => {
  const ok = await LeoniAuth.ensureAccess({
    allowPasswordChange: false,
    allowSelectGroup: true,
  });
  if (!ok) return;

  const user = LeoniAuth.getUser();
  if (user?.group_id != null && user.group_id !== "") {
    window.location.href = "/dashboard";
    return;
  }

  const form = document.getElementById("selectGroupForm");
  const alertEl = document.getElementById("groupAlert");
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnText = document.getElementById("submitBtnText");
  const submitBtnSpinner = document.getElementById("submitBtnSpinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertEl.classList.add("d-none");

    const group_id = document.getElementById("groupSelect").value;
    if (!group_id) {
      alertEl.textContent = "Veuillez sélectionner votre groupe Home Office";
      alertEl.classList.remove("d-none");
      return;
    }

    submitBtn.disabled = true;
    submitBtnText.textContent = "Saving…";
    submitBtnSpinner.classList.remove("d-none");

    try {
      const data = await LeoniAPI.selectGroup(group_id);
      await LeoniAuth.refreshSession();
      window.location.href = data.redirect || "/dashboard";
    } catch (err) {
      alertEl.textContent = err.message || "Unable to save group.";
      alertEl.classList.remove("d-none");
    } finally {
      submitBtn.disabled = false;
      submitBtnText.textContent = "Continue to dashboard";
      submitBtnSpinner.classList.add("d-none");
    }
  });
})();
