-- ============================================================
-- Migration: Harden remote work sessions and work-hour semantics
-- ============================================================
-- Safe to run multiple times. Existing planning and session data is preserved.
-- - planning.work_hour now represents actual tracked hours.
-- - planning.planned_work_hour stores the default planned remote day length.
-- - work_sessions.active_slot enables one active session per user/planning/date.
-- - duplicate active sessions are expired before adding the unique key.
-- ============================================================

USE leoni_planning;

-- 1. Add planned_work_hour for the planned/default remote work duration.
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'planning' AND COLUMN_NAME = 'planned_work_hour');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE planning ADD COLUMN planned_work_hour DECIMAL(5,2) NOT NULL DEFAULT 8.00 AFTER work_hour',
  'SELECT "Column planning.planned_work_hour already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Normalize work_hour to actual tracked hours and default new rows to 0.00.
ALTER TABLE planning MODIFY COLUMN work_hour DECIMAL(5,2) NOT NULL DEFAULT 0.00;

UPDATE planning p
LEFT JOIN (
  SELECT planning_id,
         ROUND(LEAST(COALESCE(SUM(active_seconds), 0) / 3600, 8), 2) AS tracked_hours
  FROM work_sessions
  WHERE planning_id IS NOT NULL
  GROUP BY planning_id
) ws ON ws.planning_id = p.id
SET p.work_hour = COALESCE(ws.tracked_hours, 0.00);

-- 3. Add active_slot for database-level active-session uniqueness.
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'work_sessions' AND COLUMN_NAME = 'active_slot');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE work_sessions ADD COLUMN active_slot TINYINT NULL DEFAULT NULL COMMENT "1 only while active; NULL for historical sessions" AFTER status',
  'SELECT "Column work_sessions.active_slot already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Safely close duplicate active rows before adding the unique key.
--    The newest active row is kept active; older duplicate active rows are expired
--    without adding extra active_seconds.
UPDATE work_sessions ws
JOIN (
  SELECT user_id, planning_id, work_date, MAX(id) AS keep_id
  FROM work_sessions
  WHERE status = 'active' AND planning_id IS NOT NULL
  GROUP BY user_id, planning_id, work_date
  HAVING COUNT(*) > 1
) dup
  ON dup.user_id = ws.user_id
 AND dup.planning_id = ws.planning_id
 AND dup.work_date = ws.work_date
SET ws.status = 'expired',
    ws.ended_at = COALESCE(ws.ended_at, ws.last_heartbeat_at, ws.started_at),
    ws.active_slot = NULL
WHERE ws.status = 'active'
  AND ws.id <> dup.keep_id;

UPDATE work_sessions
SET active_slot = CASE WHEN status = 'active' THEN 1 ELSE NULL END;

-- 5. Add a unique key that allows many historical rows but only one active row.
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'work_sessions' AND INDEX_NAME = 'uq_work_sessions_active');
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE work_sessions ADD UNIQUE KEY uq_work_sessions_active (user_id, planning_id, work_date, active_slot)',
  'SELECT "Index uq_work_sessions_active already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Work session hardening migration completed successfully' AS result;
