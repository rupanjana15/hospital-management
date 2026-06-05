/**
 * Doctor Model
 * Defines the structure and validation rules for doctor entities
 */

const DOCTOR_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE",
};

const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

class DoctorModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fullName = data.fullName || "";
    this.email = data.email ? data.email.toLowerCase() : "";
    this.phone = data.phone || "";
    this.passwordHash = data.passwordHash || "";
    this.specializationId = data.specializationId || null;
    this.qualification = data.qualification || "";
    this.experienceYears = data.experienceYears || 0;
    this.consultationFee = data.consultationFee || 0;
    this.status = data.status || DOCTOR_STATUS.PENDING;
    this.isChatOnline = data.isChatOnline || false;
    this.availableSlots = data.availableSlots || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLoginAt = data.lastLoginAt || null;
  }

  /**
   * Validate doctor data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Full name validation
    if (
      !this.fullName ||
      this.fullName.trim().length < 3 ||
      this.fullName.trim().length > 80
    ) {
      errors.push("Full name must be between 3 and 80 characters");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email)) {
      errors.push("Valid email is required");
    }

    // Phone validation
    const phoneRegex = /^\+91\d{10}$/;
    if (!this.phone || !phoneRegex.test(this.phone)) {
      errors.push("Valid phone number is required (format: +91XXXXXXXXXX)");
    }

    // Password hash required
    if (!this.passwordHash) {
      errors.push("Password hash is required");
    }

    // Specialization required
    if (!this.specializationId) {
      errors.push("Specialization is required");
    }

    // Qualification required
    if (!this.qualification || this.qualification.trim().length === 0) {
      errors.push("Qualification is required");
    }

    // Experience years validation (non-negative integer)
    if (this.experienceYears < 0 || !Number.isInteger(this.experienceYears)) {
      errors.push("Experience years must be a non-negative integer");
    }

    // Consultation fee validation (>= 0)
    if (this.consultationFee < 0 || !Number.isInteger(this.consultationFee)) {
      errors.push("Consultation fee must be a non-negative integer");
    }

    // Status validation
    if (!Object.values(DOCTOR_STATUS).includes(this.status)) {
      errors.push("Invalid status value");
    }

    // Available slots validation
    if (this.availableSlots && Array.isArray(this.availableSlots)) {
      this.availableSlots.forEach((slot, index) => {
        const slotErrors = this.validateSlot(slot);
        if (slotErrors.length > 0) {
          errors.push(`Slot ${index + 1}: ${slotErrors.join(", ")}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single time slot
   */
  validateSlot(slot) {
    const errors = [];

    // Day of week validation (0-6)
    if (
      slot.dayOfWeek === undefined ||
      slot.dayOfWeek < 0 ||
      slot.dayOfWeek > 6
    ) {
      errors.push("dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
    }

    // Time format validation (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!slot.startTime || !timeRegex.test(slot.startTime)) {
      errors.push("startTime must be in HH:mm format (24-hour)");
    }
    if (!slot.endTime || !timeRegex.test(slot.endTime)) {
      errors.push("endTime must be in HH:mm format (24-hour)");
    }

    // Start time must be before end time
    if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
      errors.push("startTime must be before endTime");
    }

    // Slot duration validation
    if (!slot.slotDurationMinutes || slot.slotDurationMinutes <= 0) {
      errors.push("slotDurationMinutes must be a positive number");
    }

    return errors;
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      passwordHash: this.passwordHash,
      specializationId: this.specializationId,
      qualification: this.qualification,
      experienceYears: this.experienceYears,
      consultationFee: this.consultationFee,
      status: this.status,
      isChatOnline: this.isChatOnline,
      availableSlots: this.availableSlots,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }

  /**
   * Convert to public object (excluding sensitive fields)
   * @returns {Object} Doctor data without sensitive fields
   */
  toPublicJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      specializationId: this.specializationId,
      qualification: this.qualification,
      experienceYears: this.experienceYears,
      consultationFee: this.consultationFee,
      status: this.status,
      isChatOnline: this.isChatOnline,
      availableSlots: this.availableSlots,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }
}

module.exports = {
  DoctorModel,
  DOCTOR_STATUS,
  DAYS_OF_WEEK,
};
