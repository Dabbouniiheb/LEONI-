-- ============================================================
-- Migration: Add enterprise columns to existing tables
-- ============================================================
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS checks).
-- Apply this migration to databases that were created with the old schema.
-- ============================================================

USE leoni_planning;

-- 1. Add soft delete columns to users (if not present)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_deleted');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT "Soft delete flag"',
  'SELECT "Column is_deleted already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deleted_at');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT "Soft delete timestamp"',
  'SELECT "Column deleted_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add updated_at to users (if not present)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "Column updated_at already exists on users"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add updated_at to planning (if not present)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'planning' AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE planning ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "Column updated_at already exists on planning"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add ip_address to audit_logs (if not present)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'ip_address');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45) NULL COMMENT "Client IP for security tracking"',
  'SELECT "Column ip_address already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Widen audit_logs.details from VARCHAR(500) to TEXT (if still VARCHAR)
SET @col_type = (SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'details');
SET @sql = IF(@col_type = 'varchar',
  'ALTER TABLE audit_logs MODIFY COLUMN details TEXT NULL COMMENT "Extended to TEXT for detailed log entries"',
  'SELECT "Column details is already TEXT"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Add missing indexes (safe — ignores if they already exist)
-- Index on users.role
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_user_role');
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE users ADD INDEX idx_user_role (role)',
  'SELECT "Index idx_user_role already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index on users.is_deleted
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_user_deleted');
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE users ADD INDEX idx_user_deleted (is_deleted)',
  'SELECT "Index idx_user_deleted already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index on audit_logs.action
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'audit_logs' AND INDEX_NAME = 'idx_audit_action');
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE audit_logs ADD INDEX idx_audit_action (action)',
  'SELECT "Index idx_audit_action already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Done
SELECT 'Migration completed successfully' AS result;
