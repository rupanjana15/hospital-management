/**
 * Appointment Model
 * Defines the structure and validation rules for appointment entities
 */

const APPOINTMENT_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

class AppointmentModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.patientId = data.patientId || null;
    this.doctorId = data.doctorId || null;
    this.slotId = data.slotId || null;
    this.appointmentDate = data.appointmentDate || null;
    this.startTime = data.startTime || null;
    this.endTime = data.endTime || null;
    this.status = data.status || APPOINTMENT_STATUS.PENDING;
    this.reason = data.reason || "";
    this.requiresAction = data.requiresAction || false;
    this.actionReason = data.actionReason || null;
    this.cancelledBy = data.cancelledBy || null;
    this.cancellationReason = data.cancellationReason || null;
    this.cancelledAt = data.cancelledAt || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.billId = data.billId || null;
    this.chatAllowed = data.chatAllowed !== undefined ? data.chatAllowed : true;
  }

  /**
   * Validate appointment data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Patient ID required
    if (!this.patientId) {
      errors.push("Patient ID is required");
    }

    // Doctor ID required
    if (!this.doctorId) {
      errors.push("Doctor ID is required");
    }

    // Appointment date required and must not be in the past
    if (!this.appointmentDate) {
      errors.push("Appointment date is required");
    } else {
      const appointmentDate = new Date(this.appointmentDate);
      if (isNaN(appointmentDate.getTime())) {
        errors.push("Invalid appointment date format");
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        appointmentDate.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
          errors.push("Appointment date cannot be in the past");
        }
      }
    }

    // Time format validation (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!this.startTime || !timeRegex.test(this.startTime)) {
      errors.push("startTime must be in HH:mm format (24-hour)");
    }
    if (!this.endTime || !timeRegex.test(this.endTime)) {
      errors.push("endTime must be in HH:mm format (24-hour)");
    }

    // Start time must be before end time
    if (this.startTime && this.endTime && this.startTime >= this.endTime) {
      errors.push("startTime must be before endTime");
    }

    // Status validation
    if (!Object.values(APPOINTMENT_STATUS).includes(this.status)) {
      errors.push("Invalid status value");
    }

    // Reason validation (optional, max 255 chars)
    if (this.reason && this.reason.length > 255) {
      errors.push("Reason must not exceed 255 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if status transition is valid
   */
  canTransitionTo(newStatus) {
    const validTransitions = {
      [APPOINTMENT_STATUS.PENDING]: [
        APPOINTMENT_STATUS.CONFIRMED,
        APPOINTMENT_STATUS.CANCELLED,
      ],
      [APPOINTMENT_STATUS.CONFIRMED]: [
        APPOINTMENT_STATUS.COMPLETED,
        APPOINTMENT_STATUS.CANCELLED,
      ],
      [APPOINTMENT_STATUS.COMPLETED]: [],
      [APPOINTMENT_STATUS.CANCELLED]: [],
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      patientId: this.patientId,
      doctorId: this.doctorId,
      slotId: this.slotId,
      appointmentDate: this.appointmentDate,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      reason: this.reason,
      requiresAction: this.requiresAction,
      actionReason: this.actionReason,
      cancelledBy: this.cancelledBy,
      cancellationReason: this.cancellationReason,
      cancelledAt: this.cancelledAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      billId: this.billId,
      chatAllowed: this.chatAllowed,
    };
  }
}

module.exports = {
  AppointmentModel,
  APPOINTMENT_STATUS,
};
