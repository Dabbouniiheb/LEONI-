/**
 * Database connection pool and safe initialization.
 *
 * Changes from original:
 * - Uses CREATE TABLE IF NOT EXISTS instead of DROP TABLE (data safety)
 * - Uses structured logger instead of console.log
 * - Adds graceful shutdown handler
 * - Uses async bcrypt.hash instead of bcrypt.hashSync
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
      logger.info("Seeded default user: admin@leoni.com / admin1234");
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
