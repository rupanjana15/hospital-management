/**
 * Audit Log Model
 * Defines the structure for system audit logging
 */

const USER_ROLE = {
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
};

const AUDIT_ACTION = {
  // Authentication
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  REGISTER: "REGISTER",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",

  // Patient actions
  CREATE_PATIENT: "CREATE_PATIENT",
  UPDATE_PATIENT: "UPDATE_PATIENT",
  DELETE_PATIENT: "DELETE_PATIENT",

  // Doctor actions
  CREATE_DOCTOR: "CREATE_DOCTOR",
  UPDATE_DOCTOR: "UPDATE_DOCTOR",
  APPROVE_DOCTOR: "APPROVE_DOCTOR",
  REJECT_DOCTOR: "REJECT_DOCTOR",
  DELETE_DOCTOR: "DELETE_DOCTOR",

  // Appointment actions
  CREATE_APPOINTMENT: "CREATE_APPOINTMENT",
  UPDATE_APPOINTMENT: "UPDATE_APPOINTMENT",
  CANCEL_APPOINTMENT: "CANCEL_APPOINTMENT",
  COMPLETE_APPOINTMENT: "COMPLETE_APPOINTMENT",

  // Billing actions
  CREATE_BILL: "CREATE_BILL",
  UPDATE_BILL: "UPDATE_BILL",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",

  // Medical record actions
  CREATE_MEDICAL_RECORD: "CREATE_MEDICAL_RECORD",
  UPDATE_MEDICAL_RECORD: "UPDATE_MEDICAL_RECORD",
  VIEW_MEDICAL_RECORD: "VIEW_MEDICAL_RECORD",

  // Chat actions
  SEND_MESSAGE: "SEND_MESSAGE",

  // System actions
  SYSTEM_ERROR: "SYSTEM_ERROR",
  SYSTEM_WARNING: "SYSTEM_WARNING",
};

const ENTITY_TYPE = {
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
  APPOINTMENT: "APPOINTMENT",
  BILL: "BILL",
  MEDICAL_RECORD: "MEDICAL_RECORD",
  CHAT_MESSAGE: "CHAT_MESSAGE",
  SYSTEM: "SYSTEM",
};

class AuditLogModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.userId = data.userId || null;
    this.userRole = data.userRole || USER_ROLE.SYSTEM;
    this.action = data.action || null;
    this.entityType = data.entityType || null;
    this.entityId = data.entityId || null;
    this.details = data.details || "";
  }

  /**
   * Validate audit log data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // User role validation
    if (!Object.values(USER_ROLE).includes(this.userRole)) {
      errors.push("Invalid user role");
    }

    // Action validation
    if (!this.action || !Object.values(AUDIT_ACTION).includes(this.action)) {
      errors.push("Valid action is required");
    }

    // Entity type validation (optional but if provided must be valid)
    if (
      this.entityType &&
      !Object.values(ENTITY_TYPE).includes(this.entityType)
    ) {
      errors.push("Invalid entity type");
    }

    // Details validation (max length)
    if (this.details && this.details.length > 1000) {
      errors.push("Details must not exceed 1000 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create audit log for user action
   */
  static createUserActionLog(
    userId,
    userRole,
    action,
    entityType,
    entityId,
    details
  ) {
    return new AuditLogModel({
      userId,
      userRole,
      action,
      entityType,
      entityId,
      details,
    });
  }

  /**
   * Create audit log for system action
   */
  static createSystemLog(action, details) {
    return new AuditLogModel({
      userId: null,
      userRole: USER_ROLE.SYSTEM,
      action,
      entityType: ENTITY_TYPE.SYSTEM,
      entityId: null,
      details,
    });
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      userId: this.userId,
      userRole: this.userRole,
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId,
      details: this.details,
    };
  }
}

module.exports = {
  AuditLogModel,
  USER_ROLE,
  AUDIT_ACTION,
  ENTITY_TYPE,
};
