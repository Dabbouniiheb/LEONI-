/**
 * Database connection pool with data-preserving initialization and graceful shutdown.
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const logger = require("../utils/appLogger");
const { ROLES, VALIDATION_RULES } = require("./constants");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "leoni_planning",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true, // Needed for schema initialization
});

async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    logger.info("MySQL connected via pool");

    // Read the safe schema (uses CREATE TABLE IF NOT EXISTS)
    const schemaPath = path.join(__dirname, "../sql/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Split statements by semicolon and execute sequentially
    const statements = schemaSql
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    logger.info("Database schema initialized (CREATE IF NOT EXISTS — safe)");

    const [auditIpColumns] = await connection.query(
      "SHOW COLUMNS FROM audit_logs LIKE 'ip_address'"
    );
    if (auditIpColumns.length === 0) {
      logger.info("Running automatic migration: adding ip_address to audit_logs");
      await connection.query(
        "ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45) NULL COMMENT 'Client IP for security tracking'"
      );
    }

    // Safe Migration: Add soft-delete columns if they are missing
    // This fixes the crash on older databases where `users` table already existed before refactoring
    const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'is_deleted'");
    if (columns.length === 0) {
      logger.info("Running automatic migration: adding is_deleted and deleted_at to users table");
      await connection.query(
        "ALTER TABLE users ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Soft delete flag', ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp'"
      );
    }

    const [horaireColumns] = await connection.query("SHOW COLUMNS FROM planning LIKE 'horaire'");
    if (horaireColumns.length === 0) {
      logger.info("Running automatic migration: adding horaire to planning table");
      await connection.query(
        "ALTER TABLE planning ADD COLUMN horaire VARCHAR(50) NULL DEFAULT NULL COMMENT 'Placeholder for future remote work hour calculation' AFTER work_hour"
      );
    }

    const [workHourColumns] = await connection.query("SHOW COLUMNS FROM planning LIKE 'work_hour'");
    if (workHourColumns.length > 0) {
      const workHourType = String(workHourColumns[0].Type || "").toLowerCase();
      const workHourDefault = String(workHourColumns[0].Default || "");
      if (!workHourType.startsWith("decimal") || workHourDefault !== "0.00") {
        logger.info("Running automatic migration: normalizing planning.work_hour as actual tracked hours");
        await connection.query(
          "ALTER TABLE planning MODIFY COLUMN work_hour DECIMAL(5,2) NOT NULL DEFAULT 0.00"
        );
      }
    }

    const [plannedWorkHourColumns] = await connection.query("SHOW COLUMNS FROM planning LIKE 'planned_work_hour'");
    if (plannedWorkHourColumns.length === 0) {
      logger.info("Running automatic migration: adding planned_work_hour to planning table");
      await connection.query(
        "ALTER TABLE planning ADD COLUMN planned_work_hour DECIMAL(5,2) NOT NULL DEFAULT 8.00 AFTER work_hour"
      );
    }

    const [updatedAtColumns] = await connection.query("SHOW COLUMNS FROM planning LIKE 'updated_at'");
    if (updatedAtColumns.length === 0) {
      logger.info("Running automatic migration: adding updated_at to planning table");
      await connection.query(
        "ALTER TABLE planning ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      );
    }

    logger.info("Running automatic migration: recalculating planning.work_hour from tracked sessions");
    await connection.query(
      `UPDATE planning p
       LEFT JOIN (
         SELECT planning_id,
                ROUND(LEAST(COALESCE(SUM(active_seconds), 0) / 3600, 8), 2) AS tracked_hours
         FROM work_sessions
         WHERE planning_id IS NOT NULL
         GROUP BY planning_id
       ) ws ON ws.planning_id = p.id
       SET p.work_hour = COALESCE(ws.tracked_hours, 0.00)`
    );

    const [activeSlotColumns] = await connection.query("SHOW COLUMNS FROM work_sessions LIKE 'active_slot'");
    if (activeSlotColumns.length === 0) {
      logger.info("Running automatic migration: adding active_slot to work_sessions table");
      await connection.query(
        "ALTER TABLE work_sessions ADD COLUMN active_slot TINYINT NULL DEFAULT NULL COMMENT '1 only while active; NULL for historical sessions' AFTER status"
      );
    }

    logger.info("Running automatic migration: closing duplicate active work sessions before unique index");
    await connection.query(
      `UPDATE work_sessions ws
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
         AND ws.id <> dup.keep_id`
    );

    await connection.query(
      "UPDATE work_sessions SET active_slot = CASE WHEN status = 'active' THEN 1 ELSE NULL END"
    );

    const [activeSessionIndexes] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'work_sessions'
         AND INDEX_NAME = 'uq_work_sessions_active'`
    );
    if (Number(activeSessionIndexes[0]?.count || 0) === 0) {
      logger.info("Running automatic migration: adding unique active work-session index");
      await connection.query(
        "ALTER TABLE work_sessions ADD UNIQUE KEY uq_work_sessions_active (user_id, planning_id, work_date, active_slot)"
      );
    }

    // Seed default Team Leader if the table is empty
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS count FROM users"
    );
    if (rows[0].count === 0) {
      logger.info("Empty database detected — seeding default Team Leader");
      const hashedPassword = await bcrypt.hash(
        "admin1234",
        VALIDATION_RULES.BCRYPT_SALT_ROUNDS
      );
      await connection.query(
        `INSERT INTO users (first_name, last_name, username, email, password, matricule, role, department, must_change_password, first_login)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          "Admin",
          "LEONI",
          "admin",
          "admin@leoni.com",
          hashedPassword,
          "TL-0001",
          ROLES.TEAM_LEADER,
          "Data Management",
        ]
      );
      logger.info("Default Team Leader account seeded");
    }
  } catch (error) {
    logger.error("Database initialization failed", { error });
  } finally {
    if (connection) connection.release();
  }
}

// Trigger async initialization
initializeDatabase();

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received — closing database pool");
  await pool.end();
});

module.exports = pool;
