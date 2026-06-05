/**
 * Appointment Routes
 * Defines API endpoints for appointment management
 */

const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Appointment management routes

// Book an appointment
router.post(
  "/appointments/book",
  authenticateToken,
  appointmentController.bookAppointment
);

// Reschedule an appointment
router.put(
  "/appointments/:appointmentId/reschedule",
  authenticateToken,
  appointmentController.rescheduleAppointment
);

// Cancel an appointment
router.delete(
  "/appointments/:appointmentId/cancel",
  authenticateToken,
  appointmentController.cancelAppointment
);

// Get appointment details
router.get(
  "/appointments/:appointmentId",
  authenticateToken,
  appointmentController.getAppointmentDetails
);

// Complete an appointment (by doctor)
router.put(
  "/appointments/:appointmentId/complete",
  authenticateToken,
  appointmentController.completeAppointment
);

// Get patient's appointments
router.get(
  "/patients/:patientId/appointments",
  authenticateToken,
  appointmentController.getPatientAppointments
);

// Get doctor's appointments
router.get(
  "/doctors/:doctorId/appointments",
  authenticateToken,
  appointmentController.getDoctorAppointments
);

// Notification routes

// Get patient's notifications
router.get(
  "/patients/:patientId/notifications",
  authenticateToken,
  appointmentController.getPatientNotifications
);

// Mark notification as read
router.put(
  "/notifications/:notificationId/read",
  authenticateToken,
  appointmentController.markNotificationAsRead
);

// Delete notification
router.delete(
  "/notifications/:notificationId",
  authenticateToken,
  appointmentController.deleteNotification
);

module.exports = router;
