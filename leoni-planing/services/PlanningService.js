const db = require("../config/db");
const Planning = require("../models/Planning");
const MonthlyGroupSelection = require("../models/MonthlyGroupSelection");
const PlanningGenerationWindowService = require("./PlanningGenerationWindowService");
const {
  MONTHLY_GROUP_SELECTION_ERROR_CODES,
  PLANNING_STATUS,
  VALIDATION_RULES,
} = require("../config/constants");
const { ConflictError, withErrorCode } = require("../utils/errors");

const MONTHLY_SELECTION_REQUIRED_MESSAGE =
  "Select Group A or Group B for the next month before generating the Home Office Calendar.";

class PlanningService {
  static async getPlanningGenerationWindow(connection) {
    return PlanningGenerationWindowService.getPlanningGenerationWindow(connection);
  }

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
    if (!month || !VALIDATION_RULES.MONTH_KEY_REGEX.test(month)) {
      throw new Error("Invalid month format. Expected YYYY-MM");
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let generationWindow =
        await PlanningGenerationWindowService.getPlanningGenerationWindow(connection);
      const allowedMonth =
        PlanningGenerationWindowService.validatePlanningGenerationWindow(
          month,
          generationWindow
        );

      const user = await Planning.findUserForPlanning(userId, connection);
      if (!user) {
        throw new Error("User not found");
      }

      const monthlySelection = await MonthlyGroupSelection.findByUserAndMonth(
        userId,
        allowedMonth,
        connection,
        true
      );
      const planningExists = await Planning.existsForMonth(userId, allowedMonth, connection);

      if (planningExists) {
        throw withErrorCode(
          new ConflictError("The Home Office Calendar has already been generated for this month."),
          MONTHLY_GROUP_SELECTION_ERROR_CODES.PLANNING_EXISTS
        );
      }

      if (!monthlySelection) {
        throw withErrorCode(
          new ConflictError(MONTHLY_SELECTION_REQUIRED_MESSAGE),
          MONTHLY_GROUP_SELECTION_ERROR_CODES.REQUIRED
        );
      }

      // Re-check immediately before the write so a request crossing business midnight
      // cannot use a window that has just closed.
      generationWindow =
        await PlanningGenerationWindowService.getPlanningGenerationWindow(connection);
      PlanningGenerationWindowService.validatePlanningGenerationWindow(
        allowedMonth,
        generationWindow
      );

      const [year, monthNum] = allowedMonth.split("-").map(Number);
      const planningDays = this.calculateHomeOfficeDays(year, monthNum, monthlySelection.group_id);

      // Batch INSERT instead of N individual inserts
      if (planningDays.length > 0) {
        const values = planningDays.map((day) => [
          userId,
          day.date,
          day.status,
          allowedMonth,
          VALIDATION_RULES.DEFAULT_ACTUAL_WORK_HOUR,
          VALIDATION_RULES.DEFAULT_WORK_HOUR,
        ]);
        await Planning.batchInsert(values, connection);
      }

      await connection.commit();
      return {
        planningDays,
        generationWindow,
        groupId: Number(monthlySelection.group_id),
        groupCode: Number(monthlySelection.group_id) === 1 ? "A" : "B",
      };
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
      conditions.push("mgs.group_id = ?");
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
        planned_work_hour: row.planned_work_hour,
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
