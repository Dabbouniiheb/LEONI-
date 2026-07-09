const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const { LEAVE_REQUEST_STATUS, LEAVE_TYPES } = require("../config/constants");
const { PERMISSIONS, hasPermission } = require("../config/permissions");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");

const MAX_REASON_LENGTH = 500;
const MAX_DECISION_COMMENT_LENGTH = 500;

function normalizeOptionalText(value) {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function compareDateStrings(a, b) {
  return String(a).localeCompare(String(b));
}

function validateDateRange(startDate, endDate) {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw new BadRequestError("Start date and end date must be valid dates");
  }
  if (compareDateStrings(startDate, endDate) > 0) {
    throw new BadRequestError("Start date must be before or equal to end date");
  }
}

function validateLeaveType(leaveType) {
  if (!Object.values(LEAVE_TYPES).includes(leaveType)) {
    throw new BadRequestError("Invalid leave type");
  }
}

function validateTextLength(value, maxLength, fieldName) {
  if (value && value.length > maxLength) {
    throw new BadRequestError(`${fieldName} must not exceed ${maxLength} characters`);
  }
}

function ensureLeaveManager(user) {
  if (!user || !hasPermission(user.role, PERMISSIONS.LEAVE_REQUESTS_MANAGE)) {
    throw new ForbiddenError("Access forbidden: insufficient leave request permissions");
  }
}

class LeaveRequestService {
  static async createRequest(userId, payload) {
    const startDate = String(payload.start_date || "").trim();
    const endDate = String(payload.end_date || "").trim();
    const leaveType = String(payload.leave_type || "").trim();
    const reason = normalizeOptionalText(payload.reason);

    validateDateRange(startDate, endDate);
    validateLeaveType(leaveType);
    validateTextLength(reason, MAX_REASON_LENGTH, "Reason");

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const overlapping = await LeaveRequest.findOverlapping(userId, startDate, endDate);
    if (overlapping) {
      throw new ConflictError("An overlapping pending or approved leave request already exists");
    }

    return await LeaveRequest.create({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      leave_type: leaveType,
      reason,
    });
  }

  static async getOwnRequests(userId) {
    return await LeaveRequest.findByUser(userId);
  }

  static async getAllRequests(loggedUser) {
    ensureLeaveManager(loggedUser);
    return await LeaveRequest.findAll();
  }

  static async approveRequest(requestId, reviewer, payload = {}) {
    return await this.reviewRequest(
      requestId,
      reviewer,
      LEAVE_REQUEST_STATUS.APPROVED,
      payload.decision_comment
    );
  }

  static async rejectRequest(requestId, reviewer, payload = {}) {
    return await this.reviewRequest(
      requestId,
      reviewer,
      LEAVE_REQUEST_STATUS.REJECTED,
      payload.decision_comment
    );
  }

  static async reviewRequest(requestId, reviewer, status, decisionCommentValue) {
    ensureLeaveManager(reviewer);

    const request = await LeaveRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError("Leave request not found");
    }
    if (request.status !== LEAVE_REQUEST_STATUS.PENDING) {
      throw new BadRequestError("Only pending leave requests can be reviewed");
    }
    if (String(request.user_id) === String(reviewer.id)) {
      throw new ForbiddenError("You cannot approve or reject your own leave request");
    }

    const decisionComment = normalizeOptionalText(decisionCommentValue);
    validateTextLength(decisionComment, MAX_DECISION_COMMENT_LENGTH, "Decision comment");

    const updated = await LeaveRequest.updateStatus(requestId, status, decisionComment, reviewer.id);
    if (!updated) {
      throw new BadRequestError("Only pending leave requests can be reviewed");
    }
    return updated;
  }

  static async cancelOwnRequest(requestId, requester) {
    const request = await LeaveRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError("Leave request not found");
    }
    if (String(request.user_id) !== String(requester.id)) {
      throw new ForbiddenError("You can only cancel your own leave request");
    }
    if (request.status !== LEAVE_REQUEST_STATUS.PENDING) {
      throw new BadRequestError("Only pending leave requests can be cancelled");
    }

    const updated = await LeaveRequest.cancel(requestId);
    if (!updated) {
      throw new BadRequestError("Only pending leave requests can be cancelled");
    }
    return updated;
  }
}

module.exports = LeaveRequestService;
