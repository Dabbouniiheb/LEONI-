const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "leoni_planning",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Connected (Pool)");
    
    // Read schema.sql
    const schemaPath = path.join(__dirname, "../sql/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    
    // Split statements by semicolon
    const statements = schemaSql
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log("✅ Database schema initialized successfully");

    // Seed default Team Leader user if no users exist
    const [rows] = await connection.query("SELECT COUNT(*) AS count FROM users");
    if (rows[0].count === 0) {
      console.log("🌱 Database is empty. Seeding default Team Leader account...");
      const hashedPassword = bcrypt.hashSync("admin1234", 10);
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
          "Team Leader",
          "Data Management",
        ]
      );
      console.log("✅ Seeded default user: admin@leoni.com / admin1234");
    }

    connection.release();
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
}

// Trigger async initialization
initializeDatabase();

module.exports = pool;
