const express = require("express");
const path = require("path");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const viewsPath = path.join(__dirname, "views");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(viewsPath, "assets")));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "leoni_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if running over HTTPS in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Load Middlewares
const { auth, requireRole, requireGroup } = require("./middlewares/auth");

// ================= VIEW PAGES ROUTES =================

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    if (req.session.user.must_change_password) {
      return res.redirect("/change-password");
    }
    // Only force group selection for Data Cleansing staff
    if (
      req.session.user.role === "Data Cleansing" &&
      (req.session.user.group_id == null || req.session.user.group_id === "")
    ) {
      return res.redirect("/select-group");
    }
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(viewsPath, "login.html"));
});

app.get("/change-password", auth, (req, res) => {
  res.sendFile(path.join(viewsPath, "change-password.html"));
});

app.get("/select-group", auth, (req, res) => {
  if (req.session.user.must_change_password) {
    return res.redirect("/change-password");
  }
  // Only redirect if they already selected a group
  if (req.session.user.group_id != null && req.session.user.group_id !== "") {
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(viewsPath, "select-group.html"));
});

// Guard the views using RBAC at the server level
app.get("/dashboard", auth, requireGroup, (req, res) => {
  res.sendFile(path.join(viewsPath, "dashboard.html"));
});

app.get("/users-page", auth, requireGroup, requireRole(["Team Leader"]), (req, res) => {
  res.sendFile(path.join(viewsPath, "users.html"));
});

app.get("/planning-page", auth, requireGroup, (req, res) => {
  res.sendFile(path.join(viewsPath, "planning.html"));
});

app.get("/export-page", auth, requireGroup, requireRole(["Team Leader"]), (req, res) => {
  res.sendFile(path.join(viewsPath, "export.html"));
});

app.get("/logs-page", auth, requireGroup, requireRole(["Team Leader"]), (req, res) => {
  res.sendFile(path.join(viewsPath, "logs.html"));
});

// ================= API ROUTERS =================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const planningRoutes = require("./routes/planningRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");
const logRoutes = require("./routes/logRoutes");

app.use(authRoutes);
app.use(userRoutes);
app.use(planningRoutes);
app.use(dashboardRoutes);
app.use(exportRoutes);
app.use(logRoutes);

// Global Error Handler (Prevents raw information disclosure)
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Application Error:", err);
  res.status(500).json({ message: "An unexpected internal server error occurred" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
