-- LEONI Planning — optional manual schema updates (also applied on server start)
USE leoni_planning;

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details VARCHAR(500) NULL;
ALTER TABLE planning ADD COLUMN IF NOT EXISTS month_key VARCHAR(7) NULL;
