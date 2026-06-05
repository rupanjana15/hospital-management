/**
 * Appointment Service
 * Business logic for appointment management
 */

const { v4: uuidv4 } = require("uuid");
const appointmentRepository = require("../repositories/appointment.repository");
const slotRepository = require("../repositories/slot.repository");
const patientRepository = require("../repositories/patient.repository");
const doctorRepository = require("../repositories/doctor.repository");
const notificationRepository = require("../repositories/notification.repository");
const billingService = require("../services/billing.service");
const {
  AppointmentModel,
  APPOINTMENT_STATUS,
} = require("../models/appointment.model");
const { SLOT_STATUS } = require("../models/slot.model");
const { NOTIFICATION_TYPE } = require("../models/notification.model");

class AppointmentService {
  /**
   * Generate appointment ID
   * @returns {string} Appointment ID
   */
  generateAppointmentId() {
    return `apt_${uuidv4().split("-")[0]}`;
  }

  /**
   * Generate bill ID
   * @returns {string} Bill ID
   */
  generateBillId() {
    return `bill_${uuidv4().split("-")[0]}`;
  }

  /**
   * Generate notification ID
   * @returns {string} Notification ID
   */
  generateNotificationId() {
    return `notif_${uuidv4().split("-")[0]}`;
  }

  /**
   * Book an appointment
   * @param {string} patientId - Patient ID
   * @param {string} slotId - Slot ID
   * @param {string} reason - Reason for appointment
   * @returns {Promise<Object>} Booked appointment details
   */
  async bookAppointment(patientId, slotId, reason = "") {
    // Verify patient exists
    const patient = patientRepository.findById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }
    if (patient.status !== "ACTIVE") {
      throw new Error("Patient account is not active");
    }

    // Verify slot exists and is available
    const slot = slotRepository.findById(slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }
    if (slot.status !== SLOT_STATUS.AVAILABLE) {
      throw new Error("Slot is not available for booking");
    }

    // Verify slot is not in the past
    const now = new Date();
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    const diffMinutes = (slotDateTime - now) / (1000 * 60);

    if (diffMinutes < 30) {
      throw new Error(
        "Cannot book appointments less than 30 minutes in advance"
      );
    }

    // Verify doctor exists and is approved
    const doctor = doctorRepository.findById(slot.doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }
    if (doctor.status !== "APPROVED") {
      throw new Error("Doctor is not available for appointments");
    }

    // Create appointment
    const appointmentId = this.generateAppointmentId();
    const billId = this.generateBillId();

    const appointmentData = {
      id: appointmentId,
      patientId,
      doctorId: slot.doctorId,
      slotId,
      appointmentDate: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: APPOINTMENT_STATUS.CONFIRMED,
      reason,
      billId,
    };

    const appointment = await appointmentRepository.create(appointmentData);

    // Update slot status to BOOKED
    await slotRepository.update(slotId, {
      status: SLOT_STATUS.BOOKED,
      appointmentId,
      bookedAt: new Date().toISOString(),
    });

    // Create notification for patient
    await notificationRepository.create({
      id: this.generateNotificationId(),
      userId: patientId,
      userType: "PATIENT",
      type: NOTIFICATION_TYPE.APPOINTMENT_CONFIRMED,
      title: "Appointment Confirmed",
      message: `Your appointment with ${doctor.fullName} is confirmed for ${slot.date} at ${slot.startTime}`,
      appointmentId,
    });

    return {
      success: true,
      message: "Appointment booked successfully",
      appointment: {
        id: appointment.id,
        doctorName: doctor.fullName,
        doctorSpecialization: doctor.qualification,
        date: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        consultationFee: doctor.consultationFee,
        billId,
      },
    };
  }

  /**
   * Reschedule an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} patientId - Patient ID (for authorization)
   * @param {string} newSlotId - New slot ID
   * @returns {Promise<Object>} Rescheduled appointment details
   */
  async rescheduleAppointment(appointmentId, patientId, newSlotId) {
    // Verify appointment exists
    const appointment = appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify ownership
    if (appointment.patientId !== patientId) {
      throw new Error(
        "Unauthorized: You can only reschedule your own appointments"
      );
    }

    // Don't allow rescheduling completed or cancelled appointments
    if (
      appointment.status === APPOINTMENT_STATUS.COMPLETED ||
      appointment.status === APPOINTMENT_STATUS.CANCELLED
    ) {
      throw new Error(
        `Cannot reschedule ${appointment.status.toLowerCase()} appointment`
      );
    }

    // Verify new slot exists and is available
    const newSlot = slotRepository.findById(newSlotId);
    if (!newSlot) {
      throw new Error("New slot not found");
    }
    if (newSlot.status !== SLOT_STATUS.AVAILABLE) {
      throw new Error("New slot is not available");
    }

    // Verify same doctor
    if (newSlot.doctorId !== appointment.doctorId) {
      throw new Error("New slot must be for the same doctor");
    }

    // Find and release old slot
    const oldSlot = slotRepository.findById(appointment.slotId);
    if (oldSlot) {
      // If old slot is blocked (due to leave), keep it blocked
      if (oldSlot.status === SLOT_STATUS.BLOCKED) {
        await slotRepository.update(oldSlot.id, {
          appointmentId: null,
        });
      } else {
        // Otherwise, make it available again
        await slotRepository.update(oldSlot.id, {
          status: SLOT_STATUS.AVAILABLE,
          appointmentId: null,
          bookedAt: null,
        });
      }
    }

    // Book new slot
    await slotRepository.update(newSlotId, {
      status: SLOT_STATUS.BOOKED,
      appointmentId,
      bookedAt: new Date().toISOString(),
    });

    // Update appointment
    const updatedAppointment = await appointmentRepository.update(
      appointmentId,
      {
        slotId: newSlotId,
        appointmentDate: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        status: APPOINTMENT_STATUS.CONFIRMED,
        requiresAction: false,
        actionReason: null,
      }
    );

    // Get doctor details
    const doctor = doctorRepository.findById(appointment.doctorId);

    // Create notification
    await notificationRepository.create({
      id: this.generateNotificationId(),
      userId: patientId,
      userType: "PATIENT",
      type: NOTIFICATION_TYPE.APPOINTMENT_CONFIRMED,
      title: "Appointment Rescheduled",
      message: `Your appointment with ${doctor.fullName} has been rescheduled to ${newSlot.date} at ${newSlot.startTime}`,
      appointmentId,
    });

    return {
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: {
        id: updatedAppointment.id,
        date: updatedAppointment.appointmentDate,
        startTime: updatedAppointment.startTime,
        endTime: updatedAppointment.endTime,
      },
    };
  }

  /**
   * Cancel an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} userId - User ID (patient or doctor)
   * @param {string} userType - User type (PATIENT or DOCTOR)
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelAppointment(appointmentId, userId, userType, reason = "") {
    // Verify appointment exists
    const appointment = appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify authorization
    if (userType === "PATIENT" && appointment.patientId !== userId) {
      throw new Error(
        "Unauthorized: You can only cancel your own appointments"
      );
    }
    if (userType === "DOCTOR" && appointment.doctorId !== userId) {
      throw new Error(
        "Unauthorized: You can only cancel your own appointments"
      );
    }

    // Don't allow cancelling completed appointments
    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      throw new Error("Cannot cancel completed appointment");
    }

    // Don't allow cancelling already cancelled appointments
    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw new Error("Appointment is already cancelled");
    }

    // Release slot
    const slot = slotRepository.findById(appointment.slotId);
    if (slot) {
      // If slot is blocked (due to leave), keep it blocked
      if (slot.status === SLOT_STATUS.BLOCKED) {
        await slotRepository.update(slot.id, {
          appointmentId: null,
        });
      } else {
        // Otherwise, make it available again
        await slotRepository.update(slot.id, {
          status: SLOT_STATUS.AVAILABLE,
          appointmentId: null,
          bookedAt: null,
        });
      }
    }

    // Update appointment
    const updatedAppointment = await appointmentRepository.update(
      appointmentId,
      {
        status: APPOINTMENT_STATUS.CANCELLED,
        cancelledBy: userType,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
      }
    );

    // Create notification
    const notificationUserId =
      userType === "PATIENT" ? appointment.patientId : appointment.doctorId;
    const notificationUserType = userType;
    const doctor = doctorRepository.findById(appointment.doctorId);

    await notificationRepository.create({
      id: this.generateNotificationId(),
      userId: notificationUserId,
      userType: notificationUserType,
      type: NOTIFICATION_TYPE.APPOINTMENT_CANCELLED,
      title: "Appointment Cancelled",
      message: `Your appointment with ${doctor.fullName} on ${appointment.appointmentDate} at ${appointment.startTime} has been cancelled`,
      appointmentId,
    });

    return {
      success: true,
      message: "Appointment cancelled successfully",
    };
  }

  /**
   * Get patient's appointments
   * @param {string} patientId - Patient ID
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of appointments
   */
  getPatientAppointments(patientId, filters = {}) {
    const appointments = appointmentRepository.findByPatientId(
      patientId,
      filters
    );

    return appointments.map((apt) => {
      const doctor = doctorRepository.findById(apt.doctorId);
      return {
        ...apt.toJSON(),
        doctorName: doctor ? doctor.fullName : "Unknown",
        doctorSpecialization: doctor ? doctor.qualification : "",
      };
    });
  }

  /**
   * Get doctor's appointments
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of appointments
   */
  getDoctorAppointments(doctorId, filters = {}) {
    const appointments = appointmentRepository.findByDoctorId(
      doctorId,
      filters
    );

    return appointments.map((apt) => {
      const patient = patientRepository.findById(apt.patientId);
      return {
        ...apt.toJSON(),
        patientName: patient ? patient.fullName : "Unknown",
        patientPhone: patient ? patient.phone : "",
      };
    });
  }

  /**
   * Get appointment details
   * @param {string} appointmentId - Appointment ID
   * @returns {Object} Appointment details
   */
  getAppointmentDetails(appointmentId) {
    const appointment = appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const doctor = doctorRepository.findById(appointment.doctorId);
    const patient = patientRepository.findById(appointment.patientId);

    return {
      ...appointment.toJSON(),
      doctorName: doctor ? doctor.fullName : "Unknown",
      doctorSpecialization: doctor ? doctor.qualification : "",
      patientName: patient ? patient.fullName : "Unknown",
      patientPhone: patient ? patient.phone : "",
    };
  }

  /**
   * Complete an appointment (by doctor)
   * @param {string} appointmentId - Appointment ID
   * @param {string} doctorId - Doctor ID (for authorization)
   * @returns {Promise<Object>} Result
   */
  async completeAppointment(appointmentId, doctorId) {
    const appointment = appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify ownership
    if (appointment.doctorId !== doctorId) {
      throw new Error(
        "Unauthorized: You can only complete your own appointments"
      );
    }

    // Only confirmed appointments can be completed
    if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
      throw new Error("Only confirmed appointments can be completed");
    }

    // Update appointment
    await appointmentRepository.update(appointmentId, {
      status: APPOINTMENT_STATUS.COMPLETED,
    });

    // Generate bill for the completed appointment
    try {
      const bill = await billingService.createBillForAppointment(appointmentId);
      console.log(
        `✓ Bill generated for appointment ${appointmentId}: ${bill.id}`
      );
    } catch (error) {
      console.error(
        `✗ Failed to generate bill for appointment ${appointmentId}:`,
        error.message
      );
      // Don't fail the appointment completion if bill generation fails
    }

    // Create notification for patient
    const doctor = doctorRepository.findById(doctorId);
    await notificationRepository.create({
      id: this.generateNotificationId(),
      userId: appointment.patientId,
      userType: "PATIENT",
      type: NOTIFICATION_TYPE.APPOINTMENT_COMPLETED,
      title: "Appointment Completed",
      message: `Your appointment with ${doctor.fullName} has been completed. Please check your bill for payment details.`,
      appointmentId,
    });

    return {
      success: true,
      message: "Appointment marked as completed",
    };
  }
}

module.exports = new AppointmentService();
