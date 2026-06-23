const express = require("express");
const path = require("path");
const session = require("express-session");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

dotenv.config();

const app = express();
const viewsPath = path.join(__dirname, "views");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(viewsPath, "assets")));

// Session
app.use(
  session({
    secret: "leoni_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// DB
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "leoni_planning",
});

db.connect((err) => {
  if (err) console.log("❌ MySQL Error:", err);
  else console.log("✅ MySQL Connected");
});

// ================= HELPERS =================

function logAction(user_id, action) {
  db.query(
    "INSERT INTO audit_logs (user_id, action) VALUES (?, ?)",
    [user_id, action],
    (err) => {
      if (err) console.log("log error:", err);
    }
  );
}

// ================= ROUTES =================

// HOME & APP PAGES
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(viewsPath, "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(viewsPath, "dashboard.html"));
});

app.get("/users-page", (req, res) => {
  res.sendFile(path.join(viewsPath, "users.html"));
});

app.get("/planning-page", (req, res) => {
  res.sendFile(path.join(viewsPath, "planning.html"));
});

app.get("/export-page", (req, res) => {
  res.sendFile(path.join(viewsPath, "export.html"));
});

// USERS LIST
app.get("/users", (req, res) => {
  db.query(
    "SELECT id, name, email, role, group_id FROM users",
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// REGISTER
app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role || "employee"],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User created" });
    }
  );
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, results) => {
      if (err) return res.status(500).json(err);

      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });

      const user = results[0];

      const isValid = bcrypt.compareSync(password, user.password);

      if (!isValid)
        return res.status(401).json({ message: "Wrong password" });

      logAction(user.id, "LOGIN");

      const { password: _pwd, ...safeUser } = user;

      res.json({
        message: "Login success",
        user: safeUser,
      });
    }
  );
});

// UPDATE USER
app.put("/users/:id", (req, res) => {
  const { name, role } = req.body;

  db.query(
    "UPDATE users SET name=?, role=? WHERE id=?",
    [name, role, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User updated" });
    }
  );
});

// DELETE USER
app.delete("/users/:id", (req, res) => {
  db.query(
    "DELETE FROM users WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User deleted" });
    }
  );
});

// SELECT GROUP
app.post("/select-group", (req, res) => {
  const { user_id, group_id } = req.body;

  db.query(
    "UPDATE users SET group_id=? WHERE id=?",
    [group_id, user_id],
    (err) => {
      if (err) return res.status(500).json(err);

      logAction(user_id, "SELECT GROUP");

      res.json({ success: true });
    }
  );
});

// GENERATE PLANNING
function generatePlanning(group) {
  let planning = [];

  const daysA = ["Wednesday", "Thursday", "Friday"];
  const daysB = ["Monday", "Tuesday", "Friday"];

  for (let week = 1; week <= 4; week++) {
    if (group === "A" && (week === 1 || week === 3)) {
      planning.push({ week, days: daysA });
    }

    if (group === "B" && (week === 2 || week === 4)) {
      planning.push({ week, days: daysB });
    }
  }

  return planning;
}

// SAVE PLANNING
app.post("/generate-planning", (req, res) => {
  const { user_id, group } = req.body;

  if (!user_id || !group) {
    return res.status(400).json({ message: "Missing data" });
  }

  const planning = generatePlanning(group);

  planning.forEach((week) => {
    week.days.forEach((day) => {
      db.query(
        "INSERT INTO planning (user_id, date, status) VALUES (?, ?, ?)",
        [user_id, day, "office"],
        (err) => {
          if (err) console.log("planning insert error:", err);
        }
      );
    });
  });

  logAction(user_id, "GENERATE PLANNING");

  res.json({ success: true, planning });
});

// VIEW PLANNING
app.get("/planning/:user_id", (req, res) => {
  db.query(
    `SELECT planning.*, users.name 
     FROM planning 
     JOIN users ON users.id = planning.user_id
     WHERE planning.user_id = ?`,
    [req.params.user_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// ALL PLANNING
app.get("/all-planning", (req, res) => {
  db.query(
    `SELECT planning.id, planning.user_id, planning.date, planning.status,
            users.name AS user_name, users.group_id
     FROM planning
     JOIN users ON users.id = planning.user_id
     ORDER BY planning.id DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// DASHBOARD STATS
app.get("/stats", (req, res) => {
  const stats = {
    totalUsers: 0,
    totalPlanning: 0,
    groupA: 0,
    groupB: 0,
  };

  db.query("SELECT COUNT(*) AS count FROM users", (err, userRows) => {
    if (err) return res.status(500).json(err);
    stats.totalUsers = userRows[0].count;

    db.query("SELECT COUNT(*) AS count FROM planning", (err2, planRows) => {
      if (err2) return res.status(500).json(err2);
      stats.totalPlanning = planRows[0].count;

      db.query(
        `SELECT COUNT(*) AS count FROM users
         WHERE UPPER(CAST(group_id AS CHAR)) IN ('A', '1')`,
        (err3, groupARows) => {
          if (err3) return res.status(500).json(err3);
          stats.groupA = groupARows[0].count;

          db.query(
            `SELECT COUNT(*) AS count FROM users
             WHERE UPPER(CAST(group_id AS CHAR)) IN ('B', '2')`,
            (err4, groupBRows) => {
              if (err4) return res.status(500).json(err4);
              stats.groupB = groupBRows[0].count;
              res.json(stats);
            }
          );
        }
      );
    });
  });
});

// EXPORT PLANNING (Excel-compatible CSV)
app.get("/export-planning", (req, res) => {
  db.query(
    `SELECT planning.id, users.name AS employee, users.email,
            users.group_id, planning.date, planning.status
     FROM planning
     JOIN users ON users.id = planning.user_id
     ORDER BY users.name, planning.date`,
    (err, rows) => {
      if (err) return res.status(500).json(err);

      const header = [
        "ID",
        "Employee",
        "Email",
        "Group",
        "Day",
        "Status",
      ];
      const escapeCsv = (value) => {
        const str = value == null ? "" : String(value);
        if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
        return str;
      };

      const lines = [header.join(",")];
      rows.forEach((row) => {
        lines.push(
          [
            row.id,
            row.employee,
            row.email,
            row.group_id,
            row.date,
            row.status,
          ]
            .map(escapeCsv)
            .join(",")
        );
      });

      const csv = `\uFEFF${lines.join("\n")}`;
      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="leoni-planning-export.csv"'
      );
      res.send(csv);
    }
  );
});

// SERVER
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});