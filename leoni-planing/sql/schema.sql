-- 1. Create the database and use it
CREATE DATABASE IF NOT EXISTS leoni_planning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE leoni_planning;

-- 2. Drop existing tables if they exist (to ensure a clean slate)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS planning;
DROP TABLE IF EXISTS users;

-- 3. Create Users Table
CREATE TABLE users (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_group (group_id)
) ENGINE=InnoDB;

-- 4. Create Planning Table
CREATE TABLE planning (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('onsite', 'remote') NOT NULL DEFAULT 'remote',
    month_key VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
    work_hour INT NOT NULL DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_planning_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_date (user_id, date),
    INDEX idx_planning_month (month_key)
) ENGINE=InnoDB;

-- 5. Create Audit Logs Table
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    details VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;
