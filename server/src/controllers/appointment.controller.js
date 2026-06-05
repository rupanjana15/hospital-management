/**
 * Appointment Controller
 * Handles HTTP requests for appointment management
 */

const appointmentService = require("../services/appointment.service");
const notificationRepository = require("../repositories/notification.repository");

class AppointmentController {
  /**
   * Book an appointment
   * POST /api/appointments/book
   */
  async bookAppointment(req, res) {
    try {
      const { patientId, slotId, reason } = req.body;

      // Validate request body
      if (!patientId || !slotId) {
        return res.status(400).json({
          success: false,
          message: "patientId and slotId are required",
        });
      }

      // Verify authorization (patient can only book their own appointments)
      if (req.user.role === "patient" && req.user.userId !== patientId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only book appointments for yourself",
        });
      }

      const result = await appointmentService.bookAppointment(
        patientId,
        slotId,
        reason
      );
      res.status(201).json(result);
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to book appointment",
      });
    }
  }

  /**
   * Reschedule an appointment
   * PUT /api/appointments/:appointmentId/reschedule
   */
  async rescheduleAppointment(req, res) {
    try {
      const { appointmentId } = req.params;
      const { newSlotId } = req.body;

      // Validate request body
      if (!newSlotId) {
        return res.status(400).json({
          success: false,
          message: "newSlotId is required",
        });
      }

      // Get patient ID from authenticated user
      const patientId = req.user.userId;

      const result = await appointmentService.rescheduleAppointment(
        appointmentId,
        patientId,
        newSlotId
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to reschedule appointment",
      });
    }
  }

  /**
   * Cancel an appointment
   * DELETE /api/appointments/:appointmentId/cancel
   */
  async cancelAppointment(req, res) {
    try {
      const { appointmentId } = req.params;
      const { reason } = req.body;

      const userId = req.user.userId;
      const userType = req.user.role.toUpperCase(); // Convert 'patient' to 'PATIENT', 'doctor' to 'DOCTOR'

      const result = await appointmentService.cancelAppointment(
        appointmentId,
        userId,
        userType,
        reason
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel appointment",
      });
    }
  }

  /**
   * Get patient's appointments
   * GET /api/patients/:patientId/appointments
   */
  async getPatientAppointments(req, res) {
    try {
      const { patientId } = req.params;
      const { status, startDate, endDate } = req.query;

      // Verify authorization
      if (req.user.role === "patient" && req.user.userId !== patientId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only view your own appointments",
        });
      }

      const filters = {};
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const appointments = appointmentService.getPatientAppointments(
        patientId,
        filters
      );

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch appointments",
      });
    }
  }

  /**
   * Get doctor's appointments
   * GET /api/doctors/:doctorId/appointments
   */
  async getDoctorAppointments(req, res) {
    try {
      const { doctorId } = req.params;
      const { status, startDate, endDate } = req.query;

      // Verify authorization
      if (req.user.role === "doctor" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only view your own appointments",
        });
      }

      const filters = {};
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const appointments = appointmentService.getDoctorAppointments(
        doctorId,
        filters
      );

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      console.error("Error fetching doctor appointments:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch appointments",
      });
    }
  }

  /**
   * Get appointment details
   * GET /api/appointments/:appointmentId
   */
  async getAppointmentDetails(req, res) {
    try {
      const { appointmentId } = req.params;
      const appointment =
        appointmentService.getAppointmentDetails(appointmentId);

      // Verify authorization (patient or doctor involved in the appointment)
      const userId = req.user.userId;
      if (
        appointment.patientId !== userId &&
        appointment.doctorId !== userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only view your own appointments",
        });
      }

      res.status(200).json({
        success: true,
        appointment,
      });
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Appointment not found",
      });
    }
  }

  /**
   * Complete an appointment (by doctor)
   * PUT /api/appointments/:appointmentId/complete
   */
  async completeAppointment(req, res) {
    try {
      const { appointmentId } = req.params;
      const doctorId = req.user.userId;

      // Only doctors can complete appointments
      if (req.user.role !== "DOCTOR") {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: Only doctors can complete appointments",
        });
      }

      const result = await appointmentService.completeAppointment(
        appointmentId,
        doctorId
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error completing appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to complete appointment",
      });
    }
  }

  /**
   * Get patient's notifications
   * GET /api/patients/:patientId/notifications
   */
  async getPatientNotifications(req, res) {
    try {
      const { patientId } = req.params;
      const { isRead, actionRequired } = req.query;

      // Verify authorization
      if (req.user.role === "patient" && req.user.userId !== patientId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only view your own notifications",
        });
      }

      const filters = {};
      if (isRead !== undefined) filters.isRead = isRead === "true";
      if (actionRequired !== undefined)
        filters.actionRequired = actionRequired === "true";

      const notifications = notificationRepository.findByUserId(
        patientId,
        filters
      );

      res.status(200).json({
        success: true,
        notifications: notifications.map((n) => n.toJSON()),
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch notifications",
      });
    }
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:notificationId/read
   */
  async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await notificationRepository.markAsRead(
        notificationId
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        notification: notification.toJSON(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to mark notification as read",
      });
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:notificationId
   */
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;

      const deleted = await notificationRepository.delete(notificationId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete notification",
      });
    }
  }
}

module.exports = new AppointmentController();
