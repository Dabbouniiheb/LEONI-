if (LeoniAuth.redirectIfAuthenticated()) {
  // redirected
} else {
  const form = document.getElementById("loginForm");
  const alertEl = document.getElementById("loginAlert");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const loginBtnSpinner = document.getElementById("loginBtnSpinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertEl.classList.add("d-none");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alertEl.textContent = "Please enter your email and password.";
      alertEl.classList.remove("d-none");
      return;
    }

    loginBtn.disabled = true;
    loginBtnText.textContent = "Signing in…";
    loginBtnSpinner.classList.remove("d-none");

    try {
      const data = await LeoniAPI.login(email, password);
      LeoniAuth.setUser(data.user);
      window.location.href = "/dashboard";
    } catch (err) {
      alertEl.textContent = err.message || "Login failed. Please try again.";
      alertEl.classList.remove("d-none");
    } finally {
      loginBtn.disabled = false;
      loginBtnText.textContent = "Sign in";
      loginBtnSpinner.classList.add("d-none");
    }
  });
}
