/**
 * Patient Model
 * Defines the structure and validation rules for patient entities
 */

const PATIENT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DELETED: "DELETED",
};

const GENDER = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  NOT_SPECIFIED: "NOT_SPECIFIED",
};

const BLOOD_GROUP = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
};

class PatientModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fullName = data.fullName || "";
    this.email = data.email ? data.email.toLowerCase() : "";
    this.phone = data.phone || "";
    this.passwordHash = data.passwordHash || "";
    this.dateOfBirth = data.dateOfBirth || null;
    this.gender = data.gender || GENDER.NOT_SPECIFIED;
    this.address = data.address || "";
    this.bloodGroup = data.bloodGroup || null;
    this.status = data.status || PATIENT_STATUS.ACTIVE;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLoginAt = data.lastLoginAt || null;
  }

  /**
   * Validate patient data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Full name validation (3-80 chars)
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

    // Phone validation (flexible international format)
    const phoneRegex = /^[0-9+]{10,15}$/;
    if (!this.phone || !phoneRegex.test(this.phone)) {
      errors.push("Valid phone number is required (10-15 digits, + allowed)");
    }

    // Password hash required
    if (!this.passwordHash) {
      errors.push("Password hash is required");
    }

    // Gender validation
    if (!Object.values(GENDER).includes(this.gender)) {
      errors.push("Invalid gender value");
    }

    // Address validation (max 255 chars)
    if (this.address && this.address.length > 255) {
      errors.push("Address must not exceed 255 characters");
    }

    // Blood group validation
    if (
      this.bloodGroup &&
      !Object.values(BLOOD_GROUP).includes(this.bloodGroup)
    ) {
      errors.push("Invalid blood group");
    }

    // Status validation
    if (!Object.values(PATIENT_STATUS).includes(this.status)) {
      errors.push("Invalid status value");
    }

    // Date of birth validation (optional but must be valid date if provided)
    if (this.dateOfBirth) {
      const dob = new Date(this.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push("Invalid date of birth");
      } else if (dob > new Date()) {
        errors.push("Date of birth cannot be in the future");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
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
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      address: this.address,
      bloodGroup: this.bloodGroup,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }

  /**
   * Convert to public object (excluding sensitive fields)
   * @returns {Object} Patient data without sensitive fields
   */
  toPublicJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      address: this.address,
      bloodGroup: this.bloodGroup,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }
}

module.exports = {
  PatientModel,
  PATIENT_STATUS,
  GENDER,
  BLOOD_GROUP,
};
