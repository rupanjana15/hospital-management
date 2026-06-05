/**
 * Admin Model
 * Defines the structure and validation rules for admin entities
 */

const ADMIN_ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
};

const ADMIN_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

class AdminModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fullName = data.fullName || "";
    this.email = data.email ? data.email.toLowerCase() : "";
    this.passwordHash = data.passwordHash || "";
    this.role = data.role || ADMIN_ROLE.ADMIN;
    this.status = data.status || ADMIN_STATUS.ACTIVE;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate admin data
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

    // Password hash required
    if (!this.passwordHash) {
      errors.push("Password hash is required");
    }

    // Role validation
    if (!Object.values(ADMIN_ROLE).includes(this.role)) {
      errors.push("Invalid role value");
    }

    // Status validation
    if (!Object.values(ADMIN_STATUS).includes(this.status)) {
      errors.push("Invalid status value");
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
      passwordHash: this.passwordHash,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public object (excluding sensitive fields)
   * @returns {Object} Admin data without sensitive fields
   */
  toPublicJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = {
  AdminModel,
  ADMIN_ROLE,
  ADMIN_STATUS,
};
