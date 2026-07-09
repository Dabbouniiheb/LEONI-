(async () => {
  if (!(await LeoniAuth.ensureAccess())) return;
  await LeoniAuth.refreshSession();

  const content = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Generated calendars</h2>
          <span class="text-muted small" id="calendarCount"></span>
        </div>
      </div>
      <div class="panel-body">
        <div id="calendarList" class="calendar-list">
          <div class="text-center py-4 text-muted">Loading calendars...</div>
        </div>
        <div id="calendarEmpty" class="empty-state d-none">
          <div><i class="fa-solid fa-calendar-xmark"></i></div>
          <p class="mb-0">No generated planning calendars yet.</p>
        </div>
      </div>
    </section>`;

  LeoniLayout.mount({
    pageId: "calendar",
    title: "Calendar",
    subtitle: "Generated monthly planning history",
    contentHtml: content,
  });

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthFormatter = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  });

  function parseMonthKey(monthKey) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || ""));
    if (!match) return null;

    const year = Number(match[1]);
    const monthNumber = Number(match[2]);
    if (monthNumber < 1 || monthNumber > 12) return null;

    return {
      year,
      monthIndex: monthNumber - 1,
      monthNumber,
    };
  }

  function monthLabel(monthKey) {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) return String(monthKey || "Unknown month");
    return monthFormatter.format(new Date(parsed.year, parsed.monthIndex, 1));
  }

  function dateKey(monthKey, day) {
    return `${monthKey}-${String(day).padStart(2, "0")}`;
  }

  function renderMonthGrid(calendar) {
    const parsed = parseMonthKey(calendar.month_key);
    if (!parsed) {
      return `<div class="calendar-invalid">Invalid calendar month</div>`;
    }

    const generatedDays = new Map();
    (calendar.days || []).forEach((day) => {
      const date = String(day.date || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        generatedDays.set(date, day);
      }
    });

    const firstWeekday = new Date(parsed.year, parsed.monthIndex, 1).getDay();
    const totalDays = new Date(parsed.year, parsed.monthNumber, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstWeekday; i++) {
      cells.push(`<div class="calendar-day calendar-day-empty" aria-hidden="true"></div>`);
    }

    for (let day = 1; day <= totalDays; day++) {
      const key = dateKey(calendar.month_key, day);
      const generated = generatedDays.get(key);
      const classes = generated
        ? "calendar-day calendar-day-generated"
        : "calendar-day";
      const status = generated ? String(generated.status || "remote") : "";
      const ariaLabel = generated
        ? `${key}, generated planning day`
        : key;

      cells.push(`
        <div class="${classes}" role="gridcell" aria-label="${LeoniLayout.escapeHtml(ariaLabel)}">
          <span class="calendar-day-number">${day}</span>
          ${generated ? `<span class="calendar-day-status">${LeoniLayout.escapeHtml(status)}</span>` : ""}
        </div>`);
    }

    return `
      <div class="calendar-grid" role="grid" aria-label="${LeoniLayout.escapeHtml(monthLabel(calendar.month_key))}">
        ${weekdays.map((day) => `<div class="calendar-weekday" role="columnheader">${day}</div>`).join("")}
        ${cells.join("")}
      </div>`;
  }

  function renderCalendar(calendar) {
    const userName = calendar.user_name || `User #${calendar.user_id}`;
    const group = LeoniLayout.formatGroup(calendar.group_id);
    const groupClass = LeoniLayout.groupBadgeClass(calendar.group_id);
    const totalDays = Number(calendar.total_days || (calendar.days || []).length) || 0;

    return `
      <article class="calendar-panel">
        <div class="calendar-panel-header">
          <div>
            <h3>${LeoniLayout.escapeHtml(monthLabel(calendar.month_key))}</h3>
            <div class="calendar-meta">
              <span>${LeoniLayout.escapeHtml(userName)}</span>
              <span class="badge-group ${groupClass}">Group ${LeoniLayout.escapeHtml(group)}</span>
            </div>
          </div>
          <span class="badge-role">${totalDays} day${totalDays === 1 ? "" : "s"}</span>
        </div>
        ${renderMonthGrid(calendar)}
      </article>`;
  }

  function renderCalendars(calendars) {
    const list = document.getElementById("calendarList");
    const empty = document.getElementById("calendarEmpty");
    document.getElementById("calendarCount").textContent =
      `${calendars.length} calendar${calendars.length === 1 ? "" : "s"}`;

    if (!calendars.length) {
      list.innerHTML = "";
      empty.classList.remove("d-none");
      return;
    }

    empty.classList.add("d-none");
    list.innerHTML = calendars.map(renderCalendar).join("");
  }

  LeoniLayout.showLoading(true);
  try {
    const calendars = await LeoniAPI.getPlanningCalendars();
    renderCalendars(Array.isArray(calendars) ? calendars : []);
  } catch {
    document.getElementById("calendarList").innerHTML = `
      <div class="text-center py-4 text-danger">Failed to load generated calendars.</div>`;
  } finally {
    LeoniLayout.showLoading(false);
  }
})();
