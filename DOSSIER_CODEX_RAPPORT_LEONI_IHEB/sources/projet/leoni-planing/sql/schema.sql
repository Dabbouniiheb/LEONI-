-- ============================================================
-- LEONI Planning System — Database Schema
-- ============================================================
-- Uses CREATE TABLE IF NOT EXISTS to be safe for production.
-- Never drops tables. Existing data is preserved.
-- ============================================================

CREATE DATABASE IF NOT EXISTS leoni_planning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE leoni_planning;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    matricule VARCHAR(50) NOT NULL UNIQUE,
    role ENUM('Team Leader', 'Data Cleansing') NOT NULL DEFAULT 'Data Cleansing',
    department VARCHAR(100) NOT NULL,
    group_id TINYINT NULL COMMENT '1 = Group A, 2 = Group B',
    must_change_password TINYINT(1) NOT NULL DEFAULT 1,
    first_login TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_group (group_id),
    INDEX idx_user_role (role),
    INDEX idx_user_deleted (is_deleted)
) ENGINE=InnoDB;

-- 2. Monthly Home Office Group Selections Table
CREATE TABLE IF NOT EXISTS monthly_group_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month_key CHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
    group_id TINYINT NOT NULL COMMENT '1 = Group A, 2 = Group B',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_monthly_group_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_monthly_group_id CHECK (group_id IN (1, 2)),
    UNIQUE KEY uq_monthly_group_user_month (user_id, month_key),
    INDEX idx_monthly_group_month (month_key),
    INDEX idx_monthly_group_group (group_id),
    INDEX idx_monthly_group_month_group (month_key, group_id)
) ENGINE=InnoDB;

-- 3. Planning Table
CREATE TABLE IF NOT EXISTS planning (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('onsite', 'remote') NOT NULL DEFAULT 'remote',
    month_key VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
    work_hour DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    planned_work_hour DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    horaire VARCHAR(50) NULL DEFAULT NULL COMMENT 'Placeholder for future remote work hour calculation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_planning_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_date (user_id, date),
    INDEX idx_planning_month (month_key)
) ENGINE=InnoDB;

-- 4. Work Sessions Table
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
    active_slot TINYINT NULL DEFAULT NULL COMMENT '1 only while active; NULL for historical sessions',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_work_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_sessions_planning FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE SET NULL,
    INDEX idx_work_sessions_user_date (user_id, work_date),
    INDEX idx_work_sessions_planning (planning_id),
    INDEX idx_work_sessions_status (status),
    INDEX idx_work_sessions_heartbeat (last_heartbeat_at),
    UNIQUE KEY uq_work_sessions_active (user_id, planning_id, work_date, active_slot)
) ENGINE=InnoDB;

-- 5. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    reason TEXT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    decision_comment TEXT NULL,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_leave_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_leave_user (user_id),
    INDEX idx_leave_status (status),
    INDEX idx_leave_user_status_dates (user_id, status, start_date, end_date),
    INDEX idx_leave_date_range (start_date, end_date)
) ENGINE=InnoDB;

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NULL COMMENT 'Extended to TEXT for detailed log entries',
    ip_address VARCHAR(45) NULL COMMENT 'Client IP for security tracking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB;
