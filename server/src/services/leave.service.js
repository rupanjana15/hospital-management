/**
 * Leave Service
 * Business logic for doctor leave management
 */

const { v4: uuidv4 } = require("uuid");
const leaveRepository = require("../repositories/leave.repository");
const slotRepository = require("../repositories/slot.repository");
const appointmentRepository = require("../repositories/appointment.repository");
const notificationRepository = require("../repositories/notification.repository");
const doctorRepository = require("../repositories/doctor.repository");
const { LeaveModel, LEAVE_STATUS } = require("../models/leave.model");
const { SLOT_STATUS } = require("../models/slot.model");
const { APPOINTMENT_STATUS } = require("../models/appointment.model");
const { NOTIFICATION_TYPE } = require("../models/notification.model");

class LeaveService {
  /**
   * Generate leave ID
   * @returns {string} Leave ID
   */
  generateLeaveId() {
    return `leave_${uuidv4().split("-")[0]}`;
  }

  /**
   * Generate notification ID
   * @returns {string} Notification ID
   */
  generateNotificationId() {
    return `notif_${uuidv4().split("-")[0]}`;
  }

  /**
   * Apply for leave
   * @param {string} doctorId - Doctor ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} reason - Leave reason
   * @returns {Promise<Object>} Leave details and affected appointments
   */
  async applyLeave(doctorId, startDate, endDate, reason = "") {
    // Verify doctor exists
    const doctor = doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Create leave model for validation
    const leaveData = {
      id: this.generateLeaveId(),
      doctorId,
      startDate,
      endDate,
      reason,
      status: LEAVE_STATUS.APPROVED, // Auto-approve for now
    };

    const leave = new LeaveModel(leaveData);
    const validation = leave.validate();
    if (!validation.isValid) {
      throw new Error(`Validation error: ${validation.errors.join(", ")}`);
    }

    // Get all dates in the leave range
    const leaveDates = leave.getAllDates();

    const affectedSlots = [];
    const affectedAppointments = [];
    const notificationsToCreate = [];

    // Process each date
    for (const date of leaveDates) {
      // Find all slots for this doctor on this date
      const slotsOnDate = slotRepository.findByDoctorAndDate(doctorId, date);

      for (const slot of slotsOnDate) {
        // Skip already deleted slots
        if (slot.status === SLOT_STATUS.DELETED) {
          continue;
        }

        affectedSlots.push(slot.id);

        if (slot.status === SLOT_STATUS.AVAILABLE) {
          // Block available slots
          await slotRepository.update(slot.id, {
            status: SLOT_STATUS.BLOCKED,
            blockedReason: "Doctor on leave",
            blockedAt: new Date().toISOString(),
          });
        } else if (slot.status === SLOT_STATUS.BOOKED) {
          // Handle booked slots - find appointment and mark for reschedule
          const appointment = appointmentRepository.findBySlotId(slot.id);
          if (appointment) {
            affectedAppointments.push(appointment.id);

            // Update slot to blocked but keep appointment link
            await slotRepository.update(slot.id, {
              status: SLOT_STATUS.BLOCKED,
              blockedReason: "Doctor on leave",
              blockedAt: new Date().toISOString(),
            });

            // Update appointment to require action
            await appointmentRepository.update(appointment.id, {
              status: APPOINTMENT_STATUS.PENDING,
              requiresAction: true,
              actionReason: "Doctor on leave - please reschedule or cancel",
            });

            // Create notification for patient
            notificationsToCreate.push({
              id: this.generateNotificationId(),
              userId: appointment.patientId,
              userType: "PATIENT",
              type: NOTIFICATION_TYPE.RESCHEDULE_REQUIRED,
              title: "Appointment Needs Rescheduling",
              message: `Your appointment with ${doctor.fullName} on ${appointment.appointmentDate} at ${appointment.startTime} has been affected due to doctor's leave. Please reschedule or cancel.`,
              appointmentId: appointment.id,
              actionRequired: true,
              actionReason: "Doctor unavailable due to leave",
            });
          }
        }
      }
    }

    // Create all notifications
    if (notificationsToCreate.length > 0) {
      await notificationRepository.createMany(notificationsToCreate);
    }

    // Save leave record with affected slots and appointments
    leave.affectedSlots = affectedSlots;
    leave.affectedAppointments = affectedAppointments;

    const createdLeave = await leaveRepository.create(leave.toJSON());

    return {
      success: true,
      message: "Leave applied successfully",
      leave: createdLeave.toPublicJSON(),
      summary: {
        blockedSlots: affectedSlots.length,
        affectedAppointments: affectedAppointments.length,
        notificationsSent: notificationsToCreate.length,
      },
    };
  }

  /**
   * Cancel leave
   * @param {string} leaveId - Leave ID
   * @param {string} doctorId - Doctor ID (for authorization)
   * @returns {Promise<Object>} Result
   */
  async cancelLeave(leaveId, doctorId) {
    const leave = leaveRepository.findById(leaveId);
    if (!leave) {
      throw new Error("Leave not found");
    }

    // Verify ownership
    if (leave.doctorId !== doctorId) {
      throw new Error("Unauthorized: You can only cancel your own leave");
    }

    // Don't allow cancelling already cancelled leave
    if (leave.status === LEAVE_STATUS.CANCELLED) {
      throw new Error("Leave is already cancelled");
    }

    // Get all dates in the leave range
    const leaveDates = leave.getAllDates();

    // Unblock slots that were blocked due to this leave
    for (const slotId of leave.affectedSlots) {
      const slot = slotRepository.findById(slotId);
      if (
        slot &&
        slot.status === SLOT_STATUS.BLOCKED &&
        slot.blockedReason === "Doctor on leave"
      ) {
        // If slot has no appointment, make it available
        if (!slot.appointmentId) {
          await slotRepository.update(slotId, {
            status: SLOT_STATUS.AVAILABLE,
            blockedReason: null,
            blockedAt: null,
          });
        } else {
          // If slot has appointment, restore it to booked
          await slotRepository.update(slotId, {
            status: SLOT_STATUS.BOOKED,
            blockedReason: null,
            blockedAt: null,
          });

          // Update appointment back to confirmed
          const appointment = appointmentRepository.findBySlotId(slotId);
          if (appointment && appointment.requiresAction) {
            await appointmentRepository.update(appointment.id, {
              status: APPOINTMENT_STATUS.CONFIRMED,
              requiresAction: false,
              actionReason: null,
            });
          }
        }
      }
    }

    // Update leave status
    await leaveRepository.update(leaveId, {
      status: LEAVE_STATUS.CANCELLED,
    });

    return {
      success: true,
      message: "Leave cancelled successfully",
    };
  }

  /**
   * Get doctor's leaves
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of leaves
   */
  getDoctorLeaves(doctorId, filters = {}) {
    const leaves = leaveRepository.findByDoctorId(doctorId, filters);
    return leaves.map((leave) => leave.toPublicJSON());
  }

  /**
   * Get leave details
   * @param {string} leaveId - Leave ID
   * @returns {Object} Leave details
   */
  getLeaveDetails(leaveId) {
    const leave = leaveRepository.findById(leaveId);
    if (!leave) {
      throw new Error("Leave not found");
    }

    return leave.toJSON();
  }
}

module.exports = new LeaveService();
