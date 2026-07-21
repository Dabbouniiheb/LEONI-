-- ============================================================
-- Migration: Add updated_at column to planning
-- ============================================================
-- Safe to run multiple times. Existing planning data is preserved.
-- ============================================================

USE leoni_planning;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'planning' AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE planning ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "Column updated_at already exists on planning"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'updated_at migration completed successfully' AS result;
