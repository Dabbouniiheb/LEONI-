const db = require("../config/db");
const MonthlyGroupSelection = require("../models/MonthlyGroupSelection");
const PlanningGenerationWindowService = require("./PlanningGenerationWindowService");
const {
  AUDIT_ACTIONS,
  GROUPS,
  MONTHLY_GROUP_SELECTION_ERROR_CODES,
  ROLES,
  VALIDATION_RULES,
} = require("../config/constants");
const { logAction } = require("../utils/logger");
const { BadRequestError, ConflictError, NotFoundError, withErrorCode } = require("../utils/errors");

const LOCKED_MESSAGE =
  "The group selection cannot be changed because the Home Office Calendar has already been generated for this month.";

class MonthlyGroupSelectionService {
  static validateMonth(month) {
    const monthKey = String(month || "").trim();
    if (!VALIDATION_RULES.MONTH_KEY_REGEX.test(monthKey)) {
      throw new BadRequestError("Invalid month format. Expected YYYY-MM");
    }
    return monthKey;
  }

  static normalizeGroup(groupId) {
    const value = String(groupId ?? "").trim().toUpperCase();
    if (value === "1" || value === "A") return GROUPS.A;
    if (value === "2" || value === "B") return GROUPS.B;
    throw new BadRequestError("Group must be A or B");
  }

  static groupCode(groupId) {
    return Number(groupId) === GROUPS.A ? "A" : "B";
  }

  static formatSelection(selection, planningExists) {
    if (!selection) return null;
    return {
      group_id: Number(selection.group_id),
      group_code: this.groupCode(selection.group_id),
      locked: Boolean(planningExists),
      created_at: selection.created_at,
      updated_at: selection.updated_at,
    };
  }

  static async getMine(userId, month) {
    const monthKey = this.validateMonth(month);
    const user = await MonthlyGroupSelection.findActiveUser(userId);
    if (!user) throw new NotFoundError("User not found");

    const [selection, planningExists] = await Promise.all([
      MonthlyGroupSelection.findByUserAndMonth(userId, monthKey),
      MonthlyGroupSelection.planningExists(userId, monthKey),
    ]);

    return {
      month: monthKey,
      selection: this.formatSelection(selection, planningExists),
      planning_exists: planningExists,
    };
  }

  static async saveMine(userId, month, groupId, ipAddress = null) {
    const monthKey = this.validateMonth(month);
    const normalizedGroup = this.normalizeGroup(groupId);
    const connection = await db.getConnection();
    let previousGroup = null;
    let selection = null;
    let planningExists = false;
    let changed = false;
    let generationWindow = null;

    try {
      await connection.beginTransaction();

      generationWindow =
        await PlanningGenerationWindowService.getPlanningGenerationWindow(connection);
      PlanningGenerationWindowService.validatePlanningGenerationWindow(
        monthKey,
        generationWindow
      );

      const user = await MonthlyGroupSelection.findActiveUser(userId, connection, true);
      if (!user) throw new NotFoundError("User not found");

      const existing = await MonthlyGroupSelection.findByUserAndMonth(
        userId,
        monthKey,
        connection,
        true
      );
      previousGroup = existing ? Number(existing.group_id) : null;
      planningExists = await MonthlyGroupSelection.planningExists(userId, monthKey, connection);

      // Keep the selection write under the same authoritative window even if the
      // request crosses business midnight while the transaction is in progress.
      generationWindow =
        await PlanningGenerationWindowService.getPlanningGenerationWindow(connection);
      PlanningGenerationWindowService.validatePlanningGenerationWindow(
        monthKey,
        generationWindow
      );

      if (planningExists && previousGroup !== normalizedGroup) {
        throw withErrorCode(
          new ConflictError(LOCKED_MESSAGE),
          MONTHLY_GROUP_SELECTION_ERROR_CODES.LOCKED
        );
      }

      if (previousGroup !== normalizedGroup) {
        selection = await MonthlyGroupSelection.upsert(
          userId,
          monthKey,
          normalizedGroup,
          connection
        );
        changed = true;
      } else {
        selection = existing;
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (changed) {
      const action = previousGroup == null
        ? AUDIT_ACTIONS.MONTHLY_GROUP_SELECTED
        : AUDIT_ACTIONS.MONTHLY_GROUP_CHANGED;
      const previousCode = previousGroup == null ? "none" : this.groupCode(previousGroup);
      await logAction(
        userId,
        action,
        `server_date=${generationWindow.server_date}; timezone=${generationWindow.timezone}; month=${monthKey}; previous_group=${previousCode}; new_group=${this.groupCode(normalizedGroup)}`,
        ipAddress
      );
    }

    return {
      month: monthKey,
      selection: this.formatSelection(selection, planningExists),
      planning_exists: planningExists,
      changed,
    };
  }

  static async getMonthStatus(month) {
    const monthKey = this.validateMonth(month);
    const rows = await MonthlyGroupSelection.listForMonth(monthKey, ROLES.DATA_CLEANSING);
    const selections = rows.map((row) => {
      const planningExists = Boolean(row.planning_exists);
      const selection = row.selection_id
        ? this.formatSelection(row, planningExists)
        : null;
      return {
        user_id: row.user_id,
        user_name: row.user_name,
        matricule: row.matricule,
        selection,
        planning_exists: planningExists,
      };
    });

    return {
      month: monthKey,
      selections,
      missing_users: selections
        .filter((item) => !item.selection)
        .map(({ user_id, user_name, matricule }) => ({
          id: user_id,
          name: user_name,
          matricule,
        })),
    };
  }
}

module.exports = MonthlyGroupSelectionService;
