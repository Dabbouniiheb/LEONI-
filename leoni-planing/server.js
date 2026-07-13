/**
 * LEONI Planning System — Application Entry Point
 *
 * Security middleware stack:
 *  1. Helmet — HTTP security headers
 *  2. Morgan — HTTP request logging
 *  3. Rate Limiting — Brute-force protection
 *  4. Cookie Parser — Signed cookie support
 *  5. Session — MySQL-backed session store (production-ready)
 *
 * Route structure:
 *  - Page routes: /, /login, /dashboard, etc.
 *  - API routes: /api/auth/*, /api/users/*, /api/planning/*, etc.
 */

const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

const logger = require("./utils/appLogger");
const { VALIDATION_RULES, HTTP_STATUS } = require("./config/constants");

const app = express();
app.set("trust proxy", 1);
const viewsPath = path.join(__dirname, "views");

// ═══════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Helmet: sets secure HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:"]
      }
    }
  })
);

// Morgan: HTTP request logging
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api", apiLimiter);

// Stricter rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
});

// ═══════════════════════════════════════════════════════════
// BODY PARSING & STATIC FILES
// ═══════════════════════════════════════════════════════════

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(viewsPath, "assets")));

// ═══════════════════════════════════════════════════════════
// SESSION (MySQL-backed store for production readiness)
// ═══════════════════════════════════════════════════════════

const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "SESSION_SECRET"];
for (const env of requiredEnv) {
  if (process.env[env] === undefined) {
    logger.error(`FATAL ERROR: Environment variable ${env} is missing.`);
    process.exit(1);
  }
}

const sessionStoreOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: VALIDATION_RULES.SESSION_MAX_AGE_MS,
  createDatabaseTable: true,
};

const sessionStore = new MySQLStore(sessionStoreOptions);

app.use(
  session({
    key: "leoni_session",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: VALIDATION_RULES.SESSION_MAX_AGE_MS,
      sameSite: "lax",
    },
  })
);

// ═══════════════════════════════════════════════════════════
// LOAD MIDDLEWARE
// ═══════════════════════════════════════════════════════════

const csurf = require("csurf");

const csrfProtection = csurf({ cookie: false });
app.use(csrfProtection);

app.get("/api/auth/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ═══════════════════════════════════════════════════════════
// VIEW (PAGE) ROUTES
// ═══════════════════════════════════════════════════════════

const viewRoutes = require("./routes/viewRoutes");
app.use("/", viewRoutes);

// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const planningRoutes = require("./routes/planningRoutes");
const monthlyGroupSelectionRoutes = require("./routes/monthlyGroupSelectionRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");
const workSessionRoutes = require("./routes/workSessionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");
const logRoutes = require("./routes/logRoutes");
const WorkSessionService = require("./services/WorkSessionService");

// Apply login rate limiter ONLY to the auth login endpoint
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/planning", planningRoutes);
app.use("/api/monthly-group-selections", monthlyGroupSelectionRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/work-sessions", workSessionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/logs", logRoutes);

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════

app.use((req, res) => {
  if (
    req.headers.accept &&
    req.headers.accept.includes("application/json")
  ) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Endpoint not found",
    });
  }
  res.status(HTTP_STATUS.NOT_FOUND).sendFile(path.join(viewsPath, "404.html"));
});

// ═══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  // Distinguish operational errors (AppError) from programming bugs
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const isOperational = err.isOperational || false;

  // Log the error with structured logger
  if (!isOperational) {
    logger.error("Unhandled application error", { error: err, path: req.originalUrl });
  } else {
    logger.warn("Operational error", { message: err.message, status: statusCode, path: req.originalUrl });
  }

  // Never leak stack traces or internal details to the client
  const message = isOperational
    ? err.message
    : "An unexpected internal server error occurred";

  res.status(statusCode).json({
    success: false,
    ...(isOperational && err.code ? { code: err.code } : {}),
    message,
    ...(err.details ? { details: err.details } : {}),
  });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`, {
    env: process.env.NODE_ENV || "development",
  });
  WorkSessionService.startStaleSessionCleanup();
});

process.on("SIGTERM", () => {
  WorkSessionService.stopStaleSessionCleanup();
  server.close(() => {
    logger.info("HTTP server closed");
  });
});
