-- ============================================================
-- Migration: Add horaire placeholder column to planning
-- ============================================================
-- Safe to run multiple times. Existing planning data is preserved.
-- ============================================================

USE leoni_planning;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'leoni_planning' AND TABLE_NAME = 'planning' AND COLUMN_NAME = 'horaire');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE planning ADD COLUMN horaire VARCHAR(50) NULL DEFAULT NULL COMMENT "Placeholder for future remote work hour calculation" AFTER work_hour',
  'SELECT "Column horaire already exists on planning"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Horaire migration completed successfully' AS result;
