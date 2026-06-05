/**
 * Leave Model
 * Defines the structure and validation rules for doctor leave entities
 */

const LEAVE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

class LeaveModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.doctorId = data.doctorId || null;
    this.startDate = data.startDate || null;
    this.endDate = data.endDate || null;
    this.reason = data.reason || "";
    this.status = data.status || LEAVE_STATUS.APPROVED; // Auto-approve for now
    this.affectedSlots = data.affectedSlots || [];
    this.affectedAppointments = data.affectedAppointments || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate leave data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Doctor ID required
    if (!this.doctorId) {
      errors.push("Doctor ID is required");
    }

    // Start date validation
    if (!this.startDate) {
      errors.push("Start date is required");
    } else {
      const startDate = new Date(this.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push("Invalid start date format");
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        if (startDate < today) {
          errors.push("Start date cannot be in the past");
        }
      }
    }

    // End date validation
    if (!this.endDate) {
      errors.push("End date is required");
    } else {
      const endDate = new Date(this.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push("Invalid end date format");
      }
    }

    // Start date must be before or equal to end date
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      if (start > end) {
        errors.push("Start date must be before or equal to end date");
      }
    }

    // Reason validation (optional, max 500 chars)
    if (this.reason && this.reason.length > 500) {
      errors.push("Reason must not exceed 500 characters");
    }

    // Status validation
    if (!Object.values(LEAVE_STATUS).includes(this.status)) {
      errors.push("Invalid status value");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all dates in the leave range
   * @returns {string[]} Array of date strings (YYYY-MM-DD)
   */
  getAllDates() {
    const dates = [];
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }

    return dates;
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      doctorId: this.doctorId,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason,
      status: this.status,
      affectedSlots: this.affectedSlots,
      affectedAppointments: this.affectedAppointments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public object (for API responses)
   */
  toPublicJSON() {
    return {
      id: this.id,
      doctorId: this.doctorId,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason,
      status: this.status,
      affectedSlotsCount: this.affectedSlots.length,
      affectedAppointmentsCount: this.affectedAppointments.length,
      createdAt: this.createdAt,
    };
  }
}

module.exports = {
  LeaveModel,
  LEAVE_STATUS,
};
