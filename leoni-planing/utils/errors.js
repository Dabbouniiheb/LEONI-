/**
 * Custom application error classes.
 *
 * These provide typed errors that the global error handler can
 * translate into proper HTTP responses with consistent structure.
 */

const { HTTP_STATUS } = require("../config/constants");

class AppError extends Error {
  /**
   * @param {string} message  — User-safe message
   * @param {number} statusCode — HTTP status code
   * @param {object} [details] — Optional validation details
   */
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distinguishes from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad request", details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden: insufficient permissions") {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

class ValidationError extends BadRequestError {
  constructor(errors = []) {
    super("Validation failed", errors);
    this.name = "ValidationError";
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
};
