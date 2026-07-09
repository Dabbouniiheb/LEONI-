/**
 * LEONI Layout Module
 *
 * Renders the application shell: sidebar, topbar, and content area.
 *
 * Key changes:
 * - Sidebar items are filtered by user permissions (from session)
 * - User role badge displayed in sidebar footer
 * - Toast notification system added
 * - Confirmation modal added (replaces window.confirm)
 */
const LeoniLayout = (() => {
  // ── Sidebar Configuration ────────────────────────────────
  // Each item declares the permission required to see it.
  // null = visible to all authenticated users.
  const navItems = [
    { id: "dashboard", href: "/dashboard", icon: "fa-gauge-high", label: "Dashboard", permission: "dashboard.read" },
    { id: "users", href: "/users-page", icon: "fa-users", label: "Users", permission: "users.read" },
    { id: "planning", href: "/planning-page", icon: "fa-calendar-days", label: "Planning", permission: "planning.read.own" },
    { id: "calendar", href: "/calendar-page", icon: "fa-calendar-week", label: "Calendar", permission: "planning.read.own" },
    { id: "leave-requests", href: "/leave-requests-page", icon: "fa-calendar-plus", label: "Demande de congé", permission: "leave_requests.read.own" },
    { id: "export", href: "/export-page", icon: "fa-file-export", label: "Export", permission: "export.csv" },
    { id: "logs", href: "/logs-page", icon: "fa-clipboard-list", label: "Audit Logs", permission: "audit.read" },
    { id: "change-password", href: "/change-password", icon: "fa-key", label: "Change Password", permission: null },
  ];

  /**
   * Filter sidebar items based on user permissions.
   */
  function getVisibleNavItems(user) {
    if (!user || !user.permissions) return [];
    return navItems.filter(
      (item) => item.permission === null || user.permissions.includes(item.permission)
    );
  }

  function renderShell({ pageId, title, subtitle }) {
    const user = LeoniAuth.getUser();
    const visibleItems = getVisibleNavItems(user);

    const navHtml = visibleItems
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
            <div class="sidebar-user-info">
              <div class="user-avatar sidebar-avatar">${LeoniAuth.initials(user?.name)}</div>
              <div class="sidebar-user-details">
                <span class="sidebar-user-name">${escapeHtml(user?.name || "User")}</span>
                <span class="sidebar-user-role">${escapeHtml(user?.role || "")}</span>
              </div>
            </div>
            <button type="button" class="btn btn-leoni-outline w-100 mt-2" id="logoutBtn">
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
                <span>${escapeHtml(user?.name || "User")}</span>
              </div>
            </div>
          </header>
          <main class="app-content" id="pageContent"></main>
        </div>
      </div>
      <div class="loading-overlay" id="globalLoading" aria-hidden="true">
        <div class="loading-spinner" role="status" aria-label="Loading"></div>
      </div>
      <div id="toastContainer" class="toast-container"></div>`;
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

  // ── Toast Notification System ────────────────────────────
  function toast({ type = "success", message, duration = 4000 }) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const icons = {
      success: "fa-circle-check",
      error: "fa-circle-xmark",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info",
    };

    const toastEl = document.createElement("div");
    toastEl.className = `leoni-toast toast-${type}`;
    toastEl.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button type="button" class="toast-close" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>`;

    container.appendChild(toastEl);

    // Trigger slide-in animation
    requestAnimationFrame(() => toastEl.classList.add("show"));

    const dismiss = () => {
      toastEl.classList.remove("show");
      toastEl.addEventListener("transitionend", () => toastEl.remove(), { once: true });
    };

    toastEl.querySelector(".toast-close").addEventListener("click", dismiss);
    if (duration > 0) setTimeout(dismiss, duration);
  }

  // ── Confirmation Modal ───────────────────────────────────
  // Replaces window.confirm() with a professional modal.
  function confirm({ title = "Confirm Action", message, confirmText = "Confirm", cancelText = "Cancel", danger = false }) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "confirm-overlay";
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <h3 class="confirm-title">${escapeHtml(title)}</h3>
          <p class="confirm-message">${escapeHtml(message)}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-leoni-outline confirm-cancel">${escapeHtml(cancelText)}</button>
            <button type="button" class="btn ${danger ? "btn-leoni-danger" : "btn-leoni-primary"} confirm-ok">${escapeHtml(confirmText)}</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("show"));

      const close = (result) => {
        overlay.classList.remove("show");
        overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
        resolve(result);
      };

      overlay.querySelector(".confirm-cancel").addEventListener("click", () => close(false));
      overlay.querySelector(".confirm-ok").addEventListener("click", () => close(true));
    });
  }

  // ── Utility Helpers ──────────────────────────────────────
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

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return {
    mount,
    showLoading,
    toast,
    confirm,
    formatGroup,
    groupBadgeClass,
    escapeHtml,
  };
})();
