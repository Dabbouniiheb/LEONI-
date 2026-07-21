-- ============================================================
-- Migration: Create work_sessions table for remote work tracking
-- ============================================================
-- Safe to run multiple times. Existing planning and session data is preserved.
-- Also upgrades planning.work_hour to decimal hours for values like 4.50.
-- ============================================================

USE leoni_planning;

SET @col_type = (SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'planning' AND COLUMN_NAME = 'work_hour');
SET @sql = IF(@col_type <> 'decimal',
  'ALTER TABLE planning MODIFY COLUMN work_hour DECIMAL(5,2) NOT NULL DEFAULT 8.00',
  'SELECT "Column planning.work_hour is already DECIMAL"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS work_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    planning_id INT NULL,
    work_date DATE NOT NULL,
    started_at DATETIME NOT NULL,
    last_heartbeat_at DATETIME NULL,
    ended_at DATETIME NULL,
    active_seconds INT NOT NULL DEFAULT 0,
    status ENUM('active', 'paused', 'ended', 'expired') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_work_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_sessions_planning FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE SET NULL,
    INDEX idx_work_sessions_user_date (user_id, work_date),
    INDEX idx_work_sessions_planning (planning_id),
    INDEX idx_work_sessions_status (status),
    INDEX idx_work_sessions_heartbeat (last_heartbeat_at)
) ENGINE=InnoDB;

SELECT 'Work sessions migration completed successfully' AS result;
