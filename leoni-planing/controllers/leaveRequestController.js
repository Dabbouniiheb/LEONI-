const LeaveRequestService = require("../services/LeaveRequestService");
const { AUDIT_ACTIONS } = require("../config/constants");
const { logAction } = require("../utils/logger");
const asyncHandler = require("../utils/asyncHandler");

exports.getOwnRequests = asyncHandler(async (req, res) => {
  const results = await LeaveRequestService.getOwnRequests(req.session.user.id);
  res.json(results);
});

exports.createRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequestService.createRequest(req.session.user.id, req.body);

  await logAction(
    req.session.user.id,
    AUDIT_ACTIONS.LEAVE_REQUEST_CREATED,
    `Created leave request ID ${request.id}`,
    req.ip
  );

  res.status(201).json({
    success: true,
    message: "Leave request submitted successfully",
    request,
  });
});

exports.cancelOwnRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequestService.cancelOwnRequest(req.params.id, req.session.user);

  await logAction(
    req.session.user.id,
    AUDIT_ACTIONS.LEAVE_REQUEST_CANCELLED,
    `Cancelled leave request ID ${request.id}`,
    req.ip
  );

  res.json({
    success: true,
    message: "Leave request cancelled successfully",
    request,
  });
});

exports.getAllRequests = asyncHandler(async (req, res) => {
  const results = await LeaveRequestService.getAllRequests(req.session.user);
  res.json(results);
});

exports.approveRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequestService.approveRequest(req.params.id, req.session.user, req.body);

  await logAction(
    req.session.user.id,
    AUDIT_ACTIONS.LEAVE_REQUEST_APPROVED,
    `Approved leave request ID ${request.id}`,
    req.ip
  );

  res.json({
    success: true,
    message: "Leave request approved successfully",
    request,
  });
});

exports.rejectRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequestService.rejectRequest(req.params.id, req.session.user, req.body);

  await logAction(
    req.session.user.id,
    AUDIT_ACTIONS.LEAVE_REQUEST_REJECTED,
    `Rejected leave request ID ${request.id}`,
    req.ip
  );

  res.json({
    success: true,
    message: "Leave request rejected successfully",
    request,
  });
});
