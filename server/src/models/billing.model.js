/**
 * Billing Model
 * Defines the structure and validation rules for bill entities
 */

const BILL_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
};

const PAYMENT_METHOD = {
  CARD: "CARD",
  UPI: "UPI",
  CASH: "CASH",
};

class BillingModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.appointmentId = data.appointmentId || null;
    this.patientId = data.patientId || null;
    this.doctorId = data.doctorId || null;
    this.amount = data.amount || 0;
    this.status = data.status || BILL_STATUS.PENDING;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.paymentMethod = data.paymentMethod || null;
    this.transactionRef = data.transactionRef || null;
  }

  /**
   * Validate billing data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Appointment ID required
    if (!this.appointmentId) {
      errors.push("Appointment ID is required");
    }

    // Patient ID required
    if (!this.patientId) {
      errors.push("Patient ID is required");
    }

    // Doctor ID required
    if (!this.doctorId) {
      errors.push("Doctor ID is required");
    }

    // Amount validation (>= 0)
    if (this.amount < 0 || !Number.isInteger(this.amount)) {
      errors.push("Amount must be a non-negative integer");
    }

    // Status validation
    if (!Object.values(BILL_STATUS).includes(this.status)) {
      errors.push("Invalid status value");
    }

    // Payment method validation (if provided)
    if (
      this.paymentMethod &&
      !Object.values(PAYMENT_METHOD).includes(this.paymentMethod)
    ) {
      errors.push("Invalid payment method");
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
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      amount: this.amount,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      paymentMethod: this.paymentMethod,
      transactionRef: this.transactionRef,
    };
  }
}

module.exports = {
  BillingModel,
  BILL_STATUS,
  PAYMENT_METHOD,
};
