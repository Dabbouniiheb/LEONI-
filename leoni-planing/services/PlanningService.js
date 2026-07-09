const db = require("../config/db");
const Planning = require("../models/Planning");
const { PLANNING_STATUS } = require("../config/constants");

class PlanningService {
  /**
   * Core business logic: Calculate Home Office days per the LEONI Cahier des Charges.
   * Group A: Wednesday + Thursday every week, Friday on weeks 1, 3, 5
   * Group B: Monday + Tuesday every week, Friday on weeks 2, 4
   */
  static calculateHomeOfficeDays(year, month, group) {
    const days = [];
    const totalDays = new Date(year, month, 0).getDate();

    // Index all Fridays in the month for alternating week logic
    const fridays = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d);
      if (dateObj.getDay() === 5) fridays.push(d);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      if (group === 1 || String(group).toUpperCase() === "A") {
        // Group A: Wednesdays & Thursdays every week
        if (dayOfWeek === 3 || dayOfWeek === 4) {
          days.push({ date: dateStr, status: PLANNING_STATUS.REMOTE });
        }
        // Group A: Fridays on weeks 1, 3, and 5
        if (dayOfWeek === 5) {
          const fridayIndex = fridays.indexOf(d) + 1;
          if (fridayIndex === 1 || fridayIndex === 3 || fridayIndex === 5) {
            days.push({ date: dateStr, status: PLANNING_STATUS.REMOTE });
          }
        }
      } else if (group === 2 || String(group).toUpperCase() === "B") {
        // Group B: Mondays & Tuesdays every week
        if (dayOfWeek === 1 || dayOfWeek === 2) {
          days.push({ date: dateStr, status: PLANNING_STATUS.REMOTE });
        }
        // Group B: Fridays on weeks 2 and 4
        if (dayOfWeek === 5) {
          const fridayIndex = fridays.indexOf(d) + 1;
          if (fridayIndex === 2 || fridayIndex === 4) {
            days.push({ date: dateStr, status: PLANNING_STATUS.REMOTE });
          }
        }
      }
    }
    return days;
  }

  static async generatePlanning(userId, month) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error("Invalid month format. Expected YYYY-MM");
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const user = await Planning.findUserForPlanning(userId, connection);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.group_id == null) {
        throw new Error("User has not selected a Home Office group");
      }

      const [year, monthNum] = month.split("-").map(Number);
      const planningDays = this.calculateHomeOfficeDays(year, monthNum, user.group_id);

      // Clear previous entries for this user and month (idempotent)
      await Planning.deleteForMonth(userId, month, connection);

      // Batch INSERT instead of N individual inserts
      if (planningDays.length > 0) {
        const values = planningDays.map((day) => [userId, day.date, day.status, month, 8]);
        await Planning.batchInsert(values, connection);
      }

      await connection.commit();
      return planningDays;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getPlanningByFilters({ month, group_id, name, loggedUser, normalizeGroupId, ROLES }) {
    const conditions = ["users.is_deleted = 0"];
    const params = [];

    // Data Cleansing employees can only view their own planning
    if (loggedUser.role !== ROLES.TEAM_LEADER) {
      conditions.push("planning.user_id = ?");
      params.push(loggedUser.id);
    } else {
      if (name && String(name).trim()) {
        conditions.push("CONCAT(users.first_name, ' ', users.last_name) LIKE ?");
        params.push(`%${String(name).trim()}%`);
      }
    }

    if (month) {
      conditions.push("planning.month_key = ?");
      params.push(String(month).slice(0, 7));
    }

    const normalizedGroup = normalizeGroupId(group_id);
    if (normalizedGroup != null) {
      conditions.push("users.group_id = ?");
      params.push(normalizedGroup);
    }

    return await Planning.findByFilters(conditions, params);
  }

  static async getPlanningByUser(targetUserId, loggedUser, ROLES) {
    if (loggedUser.role !== ROLES.TEAM_LEADER && String(targetUserId) !== String(loggedUser.id)) {
      throw new Error("Access forbidden");
    }
    return await Planning.findByUserId(targetUserId);
  }

  static async getAllPlanning(loggedUser, ROLES) {
    const conditions = ["users.is_deleted = 0"];
    const params = [];
    if (loggedUser.role !== ROLES.TEAM_LEADER) {
      conditions.push("planning.user_id = ?");
      params.push(loggedUser.id);
    }
    return await Planning.findAll(conditions, params);
  }

  static async getPlanningCalendars(loggedUser, ROLES) {
    const conditions = ["users.is_deleted = 0"];
    const params = [];

    if (loggedUser.role !== ROLES.TEAM_LEADER) {
      conditions.push("planning.user_id = ?");
      params.push(loggedUser.id);
    }

    const rows = await Planning.findCalendarRows(conditions, params);
    const calendarsByMonthAndUser = new Map();

    rows.forEach((row) => {
      const monthKey = String(row.month_key || "");
      const date = String(row.date || "").slice(0, 10);

      if (!/^\d{4}-\d{2}$/.test(monthKey) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return;
      }

      const key = `${row.user_id}:${monthKey}`;
      if (!calendarsByMonthAndUser.has(key)) {
        calendarsByMonthAndUser.set(key, {
          user_id: row.user_id,
          user_name: row.user_name,
          group_id: row.group_id,
          month_key: monthKey,
          days: [],
        });
      }

      calendarsByMonthAndUser.get(key).days.push({
        date,
        status: row.status,
        work_hour: row.work_hour,
      });
    });

    return Array.from(calendarsByMonthAndUser.values()).map((calendar) => ({
      ...calendar,
      days: calendar.days.sort((a, b) => a.date.localeCompare(b.date)),
      total_days: calendar.days.length,
    }));
  }
}

module.exports = PlanningService;
