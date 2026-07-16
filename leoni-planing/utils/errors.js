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

function withErrorCode(error, code) {
  error.code = code;
  return error;
}

module.exports = {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  withErrorCode,
};
