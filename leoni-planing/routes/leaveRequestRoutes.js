/**
 * Leave Request Routes
 *
 * Mounted at: /api/leave-requests
 */

const express = require("express");
const router = express.Router();
const leaveRequestController = require("../controllers/leaveRequestController");
const { auth, requireGroup, requirePermission } = require("../middlewares/auth");
const { PERMISSIONS } = require("../config/permissions");
const validate = require("../middlewares/validate");
const {
  leaveRequestIdValidation,
  createLeaveRequestValidation,
  reviewLeaveRequestValidation,
} = require("../validations/leaveRequestValidation");

router.get(
  "/mine",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_READ_OWN),
  leaveRequestController.getOwnRequests
);

router.post(
  "/",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_READ_OWN),
  createLeaveRequestValidation,
  validate,
  leaveRequestController.createRequest
);

router.patch(
  "/:id/cancel",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_READ_OWN),
  leaveRequestIdValidation,
  validate,
  leaveRequestController.cancelOwnRequest
);

router.get(
  "/",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_MANAGE),
  leaveRequestController.getAllRequests
);

router.patch(
  "/:id/approve",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_MANAGE),
  leaveRequestIdValidation,
  reviewLeaveRequestValidation,
  validate,
  leaveRequestController.approveRequest
);

router.patch(
  "/:id/reject",
  auth,
  requireGroup,
  requirePermission(PERMISSIONS.LEAVE_REQUESTS_MANAGE),
  leaveRequestIdValidation,
  reviewLeaveRequestValidation,
  validate,
  leaveRequestController.rejectRequest
);

module.exports = router;
