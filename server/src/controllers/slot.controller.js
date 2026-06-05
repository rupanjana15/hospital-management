/**
 * Slot Controller
 * Handles HTTP requests for slot management
 */

const slotService = require("../services/slot.service");
const leaveService = require("../services/leave.service");

class SlotController {
  /**
   * Create bulk slots for a doctor on a specific date
   * POST /api/doctors/:doctorId/slots/bulk-create
   */
  async createBulkSlots(req, res) {
    try {
      const { doctorId } = req.params;
      const { date, slots } = req.body;

      // Validate request body
      if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Date and slots array are required",
        });
      }

      // Verify authorization (doctor can only create their own slots)
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only create your own slots",
        });
      }

      const result = await slotService.createBulkSlots(doctorId, date, slots);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating bulk slots:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create slots",
      });
    }
  }

  /**
   * Create slots using quick helper
   * POST /api/doctors/:doctorId/slots/quick-create
   */
  async createQuickSlots(req, res) {
    try {
      const { doctorId } = req.params;
      const { date, startTime, endTime, slotDurationMinutes } = req.body;

      // Validate request body
      if (!date || !startTime || !endTime || !slotDurationMinutes) {
        return res.status(400).json({
          success: false,
          message:
            "Date, startTime, endTime, and slotDurationMinutes are required",
        });
      }

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only create your own slots",
        });
      }

      const result = await slotService.createQuickSlots(
        doctorId,
        date,
        startTime,
        endTime,
        slotDurationMinutes
      );
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating quick slots:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create slots",
      });
    }
  }

  /**
   * Get doctor's slots for a date range
   * GET /api/doctors/:doctorId/slots
   */
  async getDoctorSlots(req, res) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate, status } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate query parameters are required",
        });
      }

      const slots = slotService.getDoctorSlots(
        doctorId,
        startDate,
        endDate,
        status
      );

      res.status(200).json({
        success: true,
        slots,
      });
    } catch (error) {
      console.error("Error fetching doctor slots:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch slots",
      });
    }
  }

  /**
   * Get available slots for patients
   * GET /api/doctors/:doctorId/available-slots
   */
  async getAvailableSlots(req, res) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate query parameters are required",
        });
      }

      const slots = slotService.getAvailableSlots(doctorId, startDate, endDate);

      res.status(200).json({
        success: true,
        availableSlots: slots,
      });
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch available slots",
      });
    }
  }

  /**
   * Update a slot
   * PUT /api/doctors/:doctorId/slots/:slotId
   */
  async updateSlot(req, res) {
    try {
      const { doctorId, slotId } = req.params;
      const updates = req.body;

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only update your own slots",
        });
      }

      const updatedSlot = await slotService.updateSlot(
        slotId,
        doctorId,
        updates
      );

      res.status(200).json({
        success: true,
        message: "Slot updated successfully",
        slot: updatedSlot,
      });
    } catch (error) {
      console.error("Error updating slot:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update slot",
      });
    }
  }

  /**
   * Delete a slot
   * DELETE /api/doctors/:doctorId/slots/:slotId
   */
  async deleteSlot(req, res) {
    try {
      const { doctorId, slotId } = req.params;

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only delete your own slots",
        });
      }

      const result = await slotService.deleteSlot(slotId, doctorId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error deleting slot:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete slot",
      });
    }
  }

  /**
   * Get slot details
   * GET /api/slots/:slotId
   */
  async getSlotDetails(req, res) {
    try {
      const { slotId } = req.params;
      const slot = slotService.getSlotDetails(slotId);

      res.status(200).json({
        success: true,
        slot,
      });
    } catch (error) {
      console.error("Error fetching slot details:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Slot not found",
      });
    }
  }

  /**
   * Apply for leave
   * POST /api/doctors/:doctorId/leaves
   */
  async applyLeave(req, res) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate, reason } = req.body;

      // Validate request body
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only apply for your own leave",
        });
      }

      const result = await leaveService.applyLeave(
        doctorId,
        startDate,
        endDate,
        reason
      );
      res.status(201).json(result);
    } catch (error) {
      console.error("Error applying for leave:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to apply for leave",
      });
    }
  }

  /**
   * Cancel leave
   * DELETE /api/doctors/:doctorId/leaves/:leaveId
   */
  async cancelLeave(req, res) {
    try {
      const { doctorId, leaveId } = req.params;

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only cancel your own leave",
        });
      }

      const result = await leaveService.cancelLeave(leaveId, doctorId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error cancelling leave:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel leave",
      });
    }
  }

  /**
   * Get doctor's leaves
   * GET /api/doctors/:doctorId/leaves
   */
  async getDoctorLeaves(req, res) {
    try {
      const { doctorId } = req.params;
      const { status, startDate, endDate } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const leaves = leaveService.getDoctorLeaves(doctorId, filters);

      res.status(200).json({
        success: true,
        leaves,
      });
    } catch (error) {
      console.error("Error fetching doctor leaves:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch leaves",
      });
    }
  }

  /**
   * Delete multiple slots at once
   * DELETE /api/doctors/:doctorId/slots/bulk-delete
   */
  async deleteBulkSlots(req, res) {
    try {
      const { doctorId } = req.params;
      const { date, slotIds } = req.body;

      // Validate request body
      if (
        !date &&
        (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Either date or slotIds array is required",
        });
      }

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only delete your own slots",
        });
      }

      const result = await slotService.deleteBulkSlots(doctorId, {
        date,
        slotIds,
      });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error deleting bulk slots:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete slots",
      });
    }
  }

  /**
   * Update status of multiple slots at once
   * PATCH /api/doctors/:doctorId/slots/bulk-status
   */
  async updateBulkSlotStatus(req, res) {
    try {
      const { doctorId } = req.params;
      const { date, slotIds, status, reason } = req.body;

      // Validate request body
      if (
        !date &&
        (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Either date or slotIds array is required",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required (AVAILABLE or BLOCKED)",
        });
      }

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only update your own slots",
        });
      }

      const result = await slotService.updateBulkSlotStatus(
        doctorId,
        { date, slotIds },
        status,
        reason
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating bulk slot status:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update slot status",
      });
    }
  }

  /**
   * Get leave details
   * GET /api/leaves/:leaveId
   */
  async getLeaveDetails(req, res) {
    try {
      const { leaveId } = req.params;
      const leave = leaveService.getLeaveDetails(leaveId);

      res.status(200).json({
        success: true,
        leave,
      });
    } catch (error) {
      console.error("Error fetching leave details:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Leave not found",
      });
    }
  }
}

module.exports = new SlotController();
