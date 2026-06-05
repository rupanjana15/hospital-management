/**
 * Slot Model
 * Defines the structure and validation rules for slot entities
 */

const SLOT_STATUS = {
  AVAILABLE: "AVAILABLE",
  BOOKED: "BOOKED",
  BLOCKED: "BLOCKED",
  DELETED: "DELETED",
};

class SlotModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.doctorId = data.doctorId || null;
    this.date = data.date || null;
    this.startTime = data.startTime || null;
    this.endTime = data.endTime || null;
    this.status = data.status || SLOT_STATUS.AVAILABLE;
    this.appointmentId = data.appointmentId || null;
    this.blockedReason = data.blockedReason || null;
    this.blockedAt = data.blockedAt || null;
    this.bookedAt = data.bookedAt || null;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate slot data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Doctor ID required
    if (!this.doctorId) {
      errors.push("Doctor ID is required");
    }

    // Date validation - must not be in the past
    if (!this.date) {
      errors.push("Date is required");
    } else {
      const slotDate = new Date(this.date);
      if (isNaN(slotDate.getTime())) {
        errors.push("Invalid date format");
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        slotDate.setHours(0, 0, 0, 0);

        if (slotDate < today) {
          errors.push("Slot date cannot be in the past");
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
    if (!Object.values(SLOT_STATUS).includes(this.status)) {
      errors.push("Invalid status value");
    }

    // If status is BOOKED, appointmentId is required
    if (this.status === SLOT_STATUS.BOOKED && !this.appointmentId) {
      errors.push("appointmentId is required when status is BOOKED");
    }

    // If status is BLOCKED, blockedReason should be provided
    if (
      this.status === SLOT_STATUS.BLOCKED &&
      !this.blockedReason &&
      !this.appointmentId
    ) {
      errors.push(
        "blockedReason should be provided when status is BLOCKED (unless it's a leave-affected booked slot)"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if slot overlaps with another slot
   * @param {SlotModel} otherSlot
   * @returns {boolean}
   */
  overlapsWith(otherSlot) {
    if (this.date !== otherSlot.date || this.doctorId !== otherSlot.doctorId) {
      return false;
    }

    // Check time overlap: (start1 < end2) AND (start2 < end1)
    return (
      this.startTime < otherSlot.endTime && otherSlot.startTime < this.endTime
    );
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      doctorId: this.doctorId,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      appointmentId: this.appointmentId,
      blockedReason: this.blockedReason,
      blockedAt: this.blockedAt,
      bookedAt: this.bookedAt,
      createdBy: this.createdBy,
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
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}

module.exports = {
  SlotModel,
  SLOT_STATUS,
};
