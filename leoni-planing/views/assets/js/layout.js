const LeoniLayout = (() => {
  const navItems = [
    { id: "dashboard", href: "/dashboard", icon: "fa-gauge-high", label: "Dashboard" },
    { id: "users", href: "/users-page", icon: "fa-users", label: "Users" },
    { id: "planning", href: "/planning-page", icon: "fa-calendar-days", label: "Planning" },
    { id: "export", href: "/export-page", icon: "fa-file-export", label: "Export" },
    { id: "logs", href: "/logs-page", icon: "fa-clipboard-list", label: "Audit Logs" },
    { id: "change-password", href: "/change-password", icon: "fa-key", label: "Change Password" },
    { id: "select-group", href: "/select-group", icon: "fa-layer-group", label: "Group Selection" },
  ];

  function renderShell({ pageId, title, subtitle }) {
    const user = LeoniAuth.getUser();
    const navHtml = navItems
      .map(
        (item) => `
        <a href="${item.href}" class="${item.id === pageId ? "active" : ""}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>`
      )
      .join("");

    return `
      <div class="app-shell">
        <aside class="app-sidebar" id="appSidebar">
          <div class="sidebar-brand">
            <div class="brand-mark">
              <div class="brand-logo">L</div>
              <div>
                <h1>LEONI Planning</h1>
                <p>Internal HR System</p>
              </div>
            </div>
          </div>
          <nav class="sidebar-nav" aria-label="Main navigation">
            <div class="nav-label">Menu</div>
            ${navHtml}
          </nav>
          <div class="sidebar-footer">
            <button type="button" class="btn btn-leoni-outline w-100" id="logoutBtn">
              <i class="fa-solid fa-right-from-bracket me-2"></i>Logout
            </button>
          </div>
        </aside>
        <div class="app-main">
          <header class="app-topbar">
            <div class="topbar-left">
              <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle menu">
                <i class="fa-solid fa-bars"></i>
              </button>
              <div>
                <h1 class="topbar-title">${title}</h1>
                ${subtitle ? `<p class="topbar-subtitle">${subtitle}</p>` : ""}
              </div>
            </div>
            <div class="topbar-user">
              <div class="user-pill">
                <div class="user-avatar">${LeoniAuth.initials(user?.name)}</div>
                <span>${user?.name || "User"}</span>
              </div>
            </div>
          </header>
          <main class="app-content" id="pageContent"></main>
        </div>
      </div>
      <div class="loading-overlay" id="globalLoading" aria-hidden="true">
        <div class="loading-spinner" role="status" aria-label="Loading"></div>
      </div>`;
  }

  function mount({ pageId, title, subtitle, contentHtml }) {
    document.body.innerHTML = renderShell({ pageId, title, subtitle });
    document.getElementById("pageContent").innerHTML = contentHtml;

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      LeoniAuth.logout();
    });

    const sidebar = document.getElementById("appSidebar");
    document.getElementById("sidebarToggle")?.addEventListener("click", () => {
      sidebar?.classList.toggle("open");
    });

    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
      link.addEventListener("click", () => sidebar?.classList.remove("open"));
    });
  }

  function showLoading(show) {
    const el = document.getElementById("globalLoading");
    if (!el) return;
    el.classList.toggle("show", show);
    el.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function formatGroup(groupId) {
    if (groupId == null || groupId === "") return "—";
    const val = String(groupId).toUpperCase();
    if (val === "1") return "A";
    if (val === "2") return "B";
    return val;
  }

  function groupBadgeClass(groupId) {
    const g = formatGroup(groupId);
    if (g === "A") return "group-a";
    if (g === "B") return "group-b";
    return "";
  }

  return {
    mount,
    showLoading,
    formatGroup,
    groupBadgeClass,
  };
})();
