-- ============================================================
-- Migration: Create monthly Home Office group selections
-- ============================================================
-- Safe to run multiple times. Existing users and planning rows
-- are preserved and no legacy users.group_id values are copied.
-- ============================================================

USE leoni_planning;

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

SELECT 'Monthly group selections migration completed successfully' AS result;
