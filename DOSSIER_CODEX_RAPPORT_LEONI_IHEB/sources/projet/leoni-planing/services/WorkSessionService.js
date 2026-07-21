const db = require("../config/db");
const WorkSession = require("../models/WorkSession");
const {
  AUDIT_ACTIONS,
  PLANNING_STATUS,
  VALIDATION_RULES,
  WORK_SESSION_STATUS,
} = require("../config/constants");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} = require("../utils/errors");
const { logAction } = require("../utils/logger");
const logger = require("../utils/appLogger");

function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(value);
}

function secondsBetween(start, end) {
  const startMs = toDate(start).getTime();
  const endMs = toDate(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.floor((endMs - startMs) / 1000));
}

function addSeconds(date, seconds) {
  return new Date(toDate(date).getTime() + seconds * 1000);
}

function normalizeHours(seconds) {
  const totalActiveSeconds = Number(seconds) || 0;
  const cappedSeconds = Math.min(
    totalActiveSeconds,
    VALIDATION_RULES.WORK_SESSION_MAX_DAILY_SECONDS
  );
  return {
    totalActiveSeconds,
    totalHours: Number((totalActiveSeconds / 3600).toFixed(2)),
    cappedSeconds,
    cappedHours: Number((cappedSeconds / 3600).toFixed(2)),
  };
}

function safeDetails(parts) {
  return Object.entries(parts)
    .map(([key, value]) => `${key}=${value == null ? "null" : value}`)
    .join("; ");
}

class WorkSessionService {
  static async autoStartSession({ requester, planningId, ipAddress }) {
    await this.expireStaleSessions({ ipAddress });

    const connection = await db.getConnection();
    let session = null;
    let summary;
    let planning = null;
    let auditAction = null;
    try {
      await connection.beginTransaction();
      const clock = await WorkSession.getServerClock(connection);
      planning = planningId
        ? await WorkSession.findPlanningById(planningId, connection, { lock: true })
        : await WorkSession.findPlanningByUserDate(requester.id, clock.today, connection, { lock: true });

      if (planning && String(planning.user_id) !== String(requester.id)) {
        throw new ForbiddenError("You can only track your own remote work sessions");
      }

      if (!this.canAutoTrackPlanning(planning, clock.today)) {
        summary = await this.buildDailySummary({
          userId: requester.id,
          workDate: clock.today,
          planning: planning?.work_date === clock.today ? planning : null,
          connection,
        });
        await connection.commit();
        return {
          tracking_available: false,
          reason: "not_available_today",
          server_date: clock.today,
          planning: summary.planning,
          session: null,
          summary,
        };
      }

      const active = await WorkSession.findActiveForPlanning(
        requester.id,
        planning.id,
        planning.work_date,
        connection,
        { lock: true }
      );

      if (active) {
        session = active;
      } else {
        const paused = await WorkSession.findLatestPausedForPlanning(
          requester.id,
          planning.id,
          planning.work_date,
          connection
        );

        try {
          session = paused
            ? await WorkSession.resume(paused.id, clock.now_at, connection)
            : null;

          auditAction = paused
            ? AUDIT_ACTIONS.WORK_SESSION_RESUMED
            : AUDIT_ACTIONS.WORK_SESSION_STARTED;

          if (!session) {
            session = await WorkSession.create(
              {
                userId: requester.id,
                planningId: planning.id,
                workDate: planning.work_date,
                now: clock.now_at,
              },
              connection
            );
          }
        } catch (err) {
          if (!this.isDuplicateActiveSessionError(err)) {
            throw err;
          }

          session = await WorkSession.findActiveForPlanning(
            requester.id,
            planning.id,
            planning.work_date,
            connection,
            { lock: true }
          );
          if (!session) {
            throw err;
          }
          auditAction = null;
        }
      }

      await this.recalculateDailyWorkHours({
        userId: requester.id,
        workDate: planning.work_date,
        planningId: planning.id,
        connection,
        auditUserId: requester.id,
        ipAddress,
      });
      summary = await this.buildDailySummary({
        userId: requester.id,
        workDate: planning.work_date,
        planning,
        connection,
      });

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    if (auditAction) {
      await logAction(
        requester.id,
        auditAction,
        safeDetails({
          session_id: session.id,
          planning_id: session.planning_id,
          work_date: session.work_date,
          mode: "automatic",
        }),
        ipAddress
      );
    }

    return {
      tracking_available: true,
      reason: null,
      server_date: planning.work_date,
      planning,
      session,
      summary,
    };
  }

  static async heartbeat({ userId, sessionId, isActive, ipAddress }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const clock = await WorkSession.getServerClock(connection);
      const session = await this.getOwnedSession(sessionId, userId, connection, { lock: true });

      if (session.status !== WORK_SESSION_STATUS.ACTIVE) {
        throw new BadRequestError("Heartbeat can only be applied to an active session");
      }

      const finalized = await this.finalizeElapsedTime({
        session,
        now: clock.now_at,
        nextStatus: isActive ? WORK_SESSION_STATUS.ACTIVE : WORK_SESSION_STATUS.PAUSED,
        connection,
      });

      const summary = await this.recalculateDailyWorkHours({
        userId,
        workDate: finalized.work_date,
        planningId: finalized.planning_id,
        connection,
        auditUserId: userId,
        ipAddress,
        logWorkHourUpdate: !isActive,
      });

      await connection.commit();
      if (!isActive && finalized.status === WORK_SESSION_STATUS.PAUSED) {
        await logAction(
          userId,
          AUDIT_ACTIONS.WORK_SESSION_PAUSED,
          safeDetails({
            session_id: finalized.id,
            planning_id: finalized.planning_id,
            work_date: finalized.work_date,
            capped_hours: summary.cappedHours.toFixed(2),
            source: "heartbeat",
          }),
          ipAddress
        );
      }
      return { session: finalized, summary, server_date: clock.today };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async pauseSession({ userId, sessionId, ipAddress }) {
    const result = await this.transitionSession({
      userId,
      sessionId,
      nextStatus: WORK_SESSION_STATUS.PAUSED,
      ipAddress,
    });

    await logAction(
      userId,
      AUDIT_ACTIONS.WORK_SESSION_PAUSED,
      safeDetails({
        session_id: result.session.id,
        planning_id: result.session.planning_id,
        work_date: result.session.work_date,
        capped_hours: result.summary.cappedHours.toFixed(2),
      }),
      ipAddress
    );

    return result;
  }

  static async endSession({ userId, sessionId, ipAddress }) {
    const result = await this.transitionSession({
      userId,
      sessionId,
      nextStatus: WORK_SESSION_STATUS.ENDED,
      ipAddress,
    });

    await logAction(
      userId,
      AUDIT_ACTIONS.WORK_SESSION_ENDED,
      safeDetails({
        session_id: result.session.id,
        planning_id: result.session.planning_id,
        work_date: result.session.work_date,
        capped_hours: result.summary.cappedHours.toFixed(2),
      }),
      ipAddress
    );

    return result;
  }

  static async transitionSession({ userId, sessionId, nextStatus, ipAddress }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const clock = await WorkSession.getServerClock(connection);
      const session = await this.getOwnedSession(sessionId, userId, connection, { lock: true });

      if (![WORK_SESSION_STATUS.ACTIVE, WORK_SESSION_STATUS.PAUSED].includes(session.status)) {
        throw new BadRequestError("Only active or paused sessions can be changed");
      }

      const transitioned =
        session.status === WORK_SESSION_STATUS.ACTIVE
          ? await this.finalizeElapsedTime({
              session,
              now: clock.now_at,
              nextStatus,
              connection,
            })
          : await WorkSession.updateTiming(
              session.id,
              {
                activeSeconds: Number(session.active_seconds) || 0,
                lastHeartbeatAt: session.last_heartbeat_at,
                status: nextStatus,
                endedAt: nextStatus === WORK_SESSION_STATUS.ENDED ? clock.now_at : null,
              },
              connection
            );

      const summary = await this.recalculateDailyWorkHours({
        userId,
        workDate: transitioned.work_date,
        planningId: transitioned.planning_id,
        connection,
        auditUserId: userId,
        ipAddress,
        logWorkHourUpdate: true,
      });

      await connection.commit();
      return { session: transitioned, summary, server_date: clock.today };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getMyDailySummary({ userId, date }) {
    await this.expireStaleSessions({});

    const connection = await db.getConnection();
    try {
      const clock = await WorkSession.getServerClock(connection);
      const workDate = date || clock.today;
      return await this.buildDailySummary({
        userId,
        workDate,
        serverDate: clock.today,
        planning: null,
        connection,
      });
    } finally {
      connection.release();
    }
  }

  static async buildDailySummary({ userId, workDate, serverDate = workDate, planning, connection }) {
    const sessions = await WorkSession.findByUserDate(userId, workDate, connection);
    const currentActiveSession = await WorkSession.findCurrentActiveSession(
      userId,
      workDate,
      connection
    );
    const totalActiveSeconds = await WorkSession.sumActiveSecondsForDate(
      userId,
      workDate,
      connection
    );
    const dayPlanning =
      planning?.work_date === workDate
        ? planning
        : await WorkSession.findPlanningByUserDate(userId, workDate, connection);
    const totals = normalizeHours(totalActiveSeconds);

    return {
      date: workDate,
      server_date: serverDate,
      planning: dayPlanning,
      sessions,
      total_active_seconds: totals.totalActiveSeconds,
      total_hours: totals.totalHours,
      capped_seconds: totals.cappedSeconds,
      capped_hours: totals.cappedHours,
      totalActiveSeconds: totals.totalActiveSeconds,
      totalHours: totals.totalHours,
      cappedSeconds: totals.cappedSeconds,
      cappedHours: totals.cappedHours,
      current_active_session: currentActiveSession,
    };
  }

  static async getMonthlySummary({ requester, month, filters = {}, ipAddress }) {
    await this.expireStaleSessions({ ipAddress });

    if (!/^\d{4}-\d{2}$/.test(String(month || ""))) {
      throw new BadRequestError("Invalid month format. Expected YYYY-MM");
    }

    const [year, monthNumber] = month.split("-").map(Number);
    if (monthNumber < 1 || monthNumber > 12) {
      throw new BadRequestError("Invalid month format. Expected YYYY-MM");
    }
    const startDate = `${month}-01`;
    const endDate = `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;
    const normalizedEndDate =
      monthNumber === 12 ? `${year + 1}-01-01` : endDate;

    const rows = await WorkSession.getMonthlySummary({
      startDate,
      endDate: normalizedEndDate,
      userId: filters.user_id || null,
      groupId: filters.group_id || null,
    });

    await logAction(
      requester.id,
      AUDIT_ACTIONS.WORK_SESSION_SUMMARY_VIEWED,
      safeDetails({
        month,
        user_id: filters.user_id || "all",
        group_id: filters.group_id || "all",
      }),
      ipAddress
    );

    return {
      month,
      rows,
    };
  }

  static async expireStaleSessions({ ipAddress } = {}) {
    const connection = await db.getConnection();
    const auditEntries = [];
    try {
      await connection.beginTransaction();
      const clock = await WorkSession.getServerClock(connection);
      const staleSessions = await WorkSession.findStaleActiveSessions(
        VALIDATION_RULES.WORK_SESSION_HEARTBEAT_GRACE_SECONDS,
        connection
      );

      for (const session of staleSessions) {
        const expired = await this.finalizeElapsedTime({
          session,
          now: clock.now_at,
          nextStatus: WORK_SESSION_STATUS.EXPIRED,
          connection,
        });
        const summary = await this.recalculateDailyWorkHours({
          userId: expired.user_id,
          workDate: expired.work_date,
          planningId: expired.planning_id,
          connection,
          auditUserId: expired.user_id,
          ipAddress,
          logWorkHourUpdate: true,
        });
        auditEntries.push({ session: expired, summary });
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    for (const entry of auditEntries) {
      await logAction(
        entry.session.user_id,
        AUDIT_ACTIONS.WORK_SESSION_EXPIRED,
        safeDetails({
          session_id: entry.session.id,
          planning_id: entry.session.planning_id,
          work_date: entry.session.work_date,
          capped_hours: entry.summary.cappedHours.toFixed(2),
        }),
        ipAddress
      );
    }

    return auditEntries.length;
  }

  static async finalizeElapsedTime({ session, now, nextStatus, connection }) {
    const reference = session.last_heartbeat_at || session.started_at;
    const elapsedSeconds = secondsBetween(reference, now);
    const graceSeconds = VALIDATION_RULES.WORK_SESSION_HEARTBEAT_GRACE_SECONDS;
    const countedSeconds = Math.min(elapsedSeconds, graceSeconds);
    const activeSeconds = (Number(session.active_seconds) || 0) + countedSeconds;
    const status =
      elapsedSeconds > graceSeconds && nextStatus === WORK_SESSION_STATUS.ACTIVE
        ? WORK_SESSION_STATUS.EXPIRED
        : nextStatus;
    const endedAt =
      status === WORK_SESSION_STATUS.ENDED
        ? now
        : status === WORK_SESSION_STATUS.EXPIRED
          ? addSeconds(reference, graceSeconds)
          : null;
    const lastHeartbeatAt = status === WORK_SESSION_STATUS.EXPIRED
      ? addSeconds(reference, graceSeconds)
      : now;

    return await WorkSession.updateTiming(
      session.id,
      {
        activeSeconds,
        lastHeartbeatAt,
        status,
        endedAt,
      },
      connection
    );
  }

  static async recalculateDailyWorkHours({
    userId,
    workDate,
    planningId,
    connection,
    auditUserId,
    ipAddress,
    logWorkHourUpdate = false,
  }) {
    const totalSeconds = await WorkSession.sumActiveSecondsForDate(
      userId,
      workDate,
      connection
    );
    const totals = normalizeHours(totalSeconds);
    let targetPlanningId = planningId;

    if (!targetPlanningId) {
      const planning = await WorkSession.findPlanningByUserDate(userId, workDate, connection);
      targetPlanningId = planning?.id || null;
    }

    if (targetPlanningId) {
      await WorkSession.updatePlanningWorkHour(
        targetPlanningId,
        totals.cappedHours.toFixed(2),
        connection
      );
      if (logWorkHourUpdate) {
        await logAction(
          auditUserId || userId,
          AUDIT_ACTIONS.WORK_HOURS_UPDATED,
          safeDetails({
            planning_id: targetPlanningId,
            work_date: workDate,
            active_seconds: totals.totalActiveSeconds,
            capped_hours: totals.cappedHours.toFixed(2),
          }),
          ipAddress
        );
      }
    }

    return totals;
  }

  static async getOwnedSession(sessionId, userId, connection, options = {}) {
    const session = options.lock
      ? await WorkSession.findByIdForUpdate(sessionId, connection)
      : await WorkSession.findById(sessionId, connection);
    if (!session) {
      throw new NotFoundError("Work session not found");
    }
    if (String(session.user_id) !== String(userId)) {
      throw new ForbiddenError("You can only manage your own work sessions");
    }
    return session;
  }

  static canAutoTrackPlanning(planning, today) {
    return Boolean(
      planning &&
      !planning.is_deleted &&
      planning.status === PLANNING_STATUS.REMOTE &&
      planning.work_date === today
    );
  }

  static isDuplicateActiveSessionError(err) {
    return err?.code === "ER_DUP_ENTRY";
  }

  static startStaleSessionCleanup(options = {}) {
    if (this.staleCleanupTimer) {
      return this.staleCleanupTimer;
    }

    const intervalMs =
      options.intervalMs || VALIDATION_RULES.WORK_SESSION_STALE_CLEANUP_INTERVAL_MS;

    const runCleanup = async () => {
      if (this.staleCleanupRunning) return;
      this.staleCleanupRunning = true;
      try {
        const expiredCount = await this.expireStaleSessions({});
        if (expiredCount > 0) {
          logger.info("Scheduled stale work-session cleanup completed", {
            expiredCount,
          });
        }
      } catch (error) {
        logger.error("Scheduled stale work-session cleanup failed", { error });
      } finally {
        this.staleCleanupRunning = false;
      }
    };

    this.staleCleanupStartupTimer = setTimeout(runCleanup, 1000);
    if (typeof this.staleCleanupStartupTimer.unref === "function") {
      this.staleCleanupStartupTimer.unref();
    }

    this.staleCleanupTimer = setInterval(runCleanup, intervalMs);
    if (typeof this.staleCleanupTimer.unref === "function") {
      this.staleCleanupTimer.unref();
    }

    return this.staleCleanupTimer;
  }

  static stopStaleSessionCleanup() {
    if (this.staleCleanupStartupTimer) {
      clearTimeout(this.staleCleanupStartupTimer);
      this.staleCleanupStartupTimer = null;
    }
    if (this.staleCleanupTimer) {
      clearInterval(this.staleCleanupTimer);
      this.staleCleanupTimer = null;
    }
    this.staleCleanupRunning = false;
  }
}

module.exports = WorkSessionService;
