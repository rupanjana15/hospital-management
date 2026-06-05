/**
 * Chat Message Model
 * Defines the structure and validation rules for chat message entities
 */

const USER_TYPE = {
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
};

class ChatMessageModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.conversationId = data.conversationId || null;
    this.fromUserType = data.fromUserType || null;
    this.fromUserId = data.fromUserId || null;
    this.toUserType = data.toUserType || null;
    this.toUserId = data.toUserId || null;
    this.message = data.message || "";
    this.sentAt = data.sentAt || new Date().toISOString();
    this.readAt = data.readAt || null;
  }

  /**
   * Generate conversation ID from patient and doctor IDs
   */
  static generateConversationId(patientId, doctorId) {
    return `conv_${patientId}_${doctorId}`;
  }

  /**
   * Validate chat message data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Conversation ID required
    if (!this.conversationId) {
      errors.push("Conversation ID is required");
    }

    // From user type validation
    if (
      !this.fromUserType ||
      !Object.values(USER_TYPE).includes(this.fromUserType)
    ) {
      errors.push("Valid fromUserType is required (PATIENT or DOCTOR)");
    }

    // From user ID required
    if (!this.fromUserId) {
      errors.push("From user ID is required");
    }

    // To user type validation
    if (
      !this.toUserType ||
      !Object.values(USER_TYPE).includes(this.toUserType)
    ) {
      errors.push("Valid toUserType is required (PATIENT or DOCTOR)");
    }

    // To user ID required
    if (!this.toUserId) {
      errors.push("To user ID is required");
    }

    // Message validation
    if (!this.message || this.message.trim().length === 0) {
      errors.push("Message content is required");
    }

    if (this.message && this.message.length > 2000) {
      errors.push("Message must not exceed 2000 characters");
    }

    // From and To user types should be different
    if (this.fromUserType === this.toUserType) {
      errors.push("From and To user types must be different");
    }

    // ReadAt validation (if provided, must be valid date)
    if (this.readAt) {
      const readDate = new Date(this.readAt);
      if (isNaN(readDate.getTime())) {
        errors.push("Invalid readAt timestamp");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mark message as read
   */
  markAsRead() {
    this.readAt = new Date().toISOString();
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      fromUserType: this.fromUserType,
      fromUserId: this.fromUserId,
      toUserType: this.toUserType,
      toUserId: this.toUserId,
      message: this.message,
      sentAt: this.sentAt,
      readAt: this.readAt,
    };
  }
}

module.exports = {
  ChatMessageModel,
  USER_TYPE,
};
