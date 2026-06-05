/**
 * Notification Model
 * Defines the structure and validation rules for notification entities
 */

const NOTIFICATION_TYPE = {
  APPOINTMENT_CONFIRMED: "APPOINTMENT_CONFIRMED",
  APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED",
  APPOINTMENT_COMPLETED: "APPOINTMENT_COMPLETED",
  RESCHEDULE_REQUIRED: "RESCHEDULE_REQUIRED",
  APPOINTMENT_REMINDER: "APPOINTMENT_REMINDER",
  GENERAL: "GENERAL",
};

class NotificationModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null; // Can be patientId or doctorId
    this.userType = data.userType || "PATIENT"; // PATIENT or DOCTOR
    this.type = data.type || NOTIFICATION_TYPE.GENERAL;
    this.title = data.title || "";
    this.message = data.message || "";
    this.appointmentId = data.appointmentId || null;
    this.actionRequired = data.actionRequired || false;
    this.actionReason = data.actionReason || null;
    this.isRead = data.isRead || false;
    this.readAt = data.readAt || null;
    this.resolvedAt = data.resolvedAt || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Validate notification data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // User ID required
    if (!this.userId) {
      errors.push("User ID is required");
    }

    // User type validation
    if (!["PATIENT", "DOCTOR"].includes(this.userType)) {
      errors.push("User type must be PATIENT or DOCTOR");
    }

    // Type validation
    if (!Object.values(NOTIFICATION_TYPE).includes(this.type)) {
      errors.push("Invalid notification type");
    }

    // Title required
    if (!this.title || this.title.trim().length === 0) {
      errors.push("Title is required");
    }

    // Message required
    if (!this.message || this.message.trim().length === 0) {
      errors.push("Message is required");
    }

    // Message length validation
    if (this.message && this.message.length > 1000) {
      errors.push("Message must not exceed 1000 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mark notification as read
   */
  markAsRead() {
    this.isRead = true;
    this.readAt = new Date().toISOString();
  }

  /**
   * Mark notification as resolved
   */
  markAsResolved() {
    this.resolvedAt = new Date().toISOString();
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      userType: this.userType,
      type: this.type,
      title: this.title,
      message: this.message,
      appointmentId: this.appointmentId,
      actionRequired: this.actionRequired,
      actionReason: this.actionReason,
      isRead: this.isRead,
      readAt: this.readAt,
      resolvedAt: this.resolvedAt,
      createdAt: this.createdAt,
    };
  }
}

module.exports = {
  NotificationModel,
  NOTIFICATION_TYPE,
};
