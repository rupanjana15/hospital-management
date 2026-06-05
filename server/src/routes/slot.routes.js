/**
 * Slot Routes
 * Defines API endpoints for slot and leave management
 */

const express = require("express");
const router = express.Router();
const slotController = require("../controllers/slot.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Slot management routes

// Create bulk slots
router.post(
  "/doctors/:doctorId/slots/bulk-create",
  authenticateToken,
  slotController.createBulkSlots
);

// Create quick slots (with time range and duration)
router.post(
  "/doctors/:doctorId/slots/quick-create",
  authenticateToken,
  slotController.createQuickSlots
);

// Get doctor's slots
router.get(
  "/doctors/:doctorId/slots",
  authenticateToken,
  slotController.getDoctorSlots
);

// Get available slots for patients (public)
router.get(
  "/doctors/:doctorId/available-slots",
  authenticateToken,
  slotController.getAvailableSlots
);

// Bulk delete slots (must be BEFORE individual slot routes)
router.delete(
  "/doctors/:doctorId/slots/bulk-delete",
  authenticateToken,
  slotController.deleteBulkSlots
);

// Bulk update slot status (must be BEFORE individual slot routes)
router.patch(
  "/doctors/:doctorId/slots/bulk-status",
  authenticateToken,
  slotController.updateBulkSlotStatus
);

// Update a slot
router.put(
  "/doctors/:doctorId/slots/:slotId",
  authenticateToken,
  slotController.updateSlot
);

// Delete a slot
router.delete(
  "/doctors/:doctorId/slots/:slotId",
  authenticateToken,
  slotController.deleteSlot
);

// Get slot details
router.get("/slots/:slotId", authenticateToken, slotController.getSlotDetails);

// Leave management routes

// Apply for leave
router.post(
  "/doctors/:doctorId/leaves",
  authenticateToken,
  slotController.applyLeave
);

// Cancel leave
router.delete(
  "/doctors/:doctorId/leaves/:leaveId",
  authenticateToken,
  slotController.cancelLeave
);

// Get doctor's leaves
router.get(
  "/doctors/:doctorId/leaves",
  authenticateToken,
  slotController.getDoctorLeaves
);

// Get leave details
router.get(
  "/leaves/:leaveId",
  authenticateToken,
  slotController.getLeaveDetails
);

module.exports = router;
