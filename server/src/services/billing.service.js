/**
 * Billing Service
 * Business logic for bill management
 */

const { v4: uuidv4 } = require("uuid");
const billingRepository = require("../repositories/billing.repository");
const appointmentRepository = require("../repositories/appointment.repository");
const doctorRepository = require("../repositories/doctor.repository");
const patientRepository = require("../repositories/patient.repository");
const { BillingModel, BILL_STATUS } = require("../models/billing.model");

class BillingService {
  /**
   * Generate bill ID
   * @returns {string} Bill ID
   */
  generateBillId() {
    return `bill_${uuidv4().split("-")[0]}`;
  }

  /**
   * Create a bill for an appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<BillingModel>} Created bill
   */
  async createBillForAppointment(appointmentId) {
    // Get appointment details
    const appointment = appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Get doctor details to get consultation fee
    const doctor = doctorRepository.findById(appointment.doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Check if bill already exists for this appointment
    const existingBill = billingRepository.findByAppointmentId(appointmentId);
    if (existingBill) {
      throw new Error("Bill already exists for this appointment");
    }

    // Create bill data
    const billData = {
      id: this.generateBillId(),
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount: doctor.consultationFee,
      status: BILL_STATUS.PENDING,
    };

    // Create and validate bill
    const bill = new BillingModel(billData);
    const validation = bill.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid bill data: ${validation.errors.join(", ")}`);
    }

    // Save bill
    const createdBill = await billingRepository.create(billData);

    return createdBill;
  }

  /**
   * Get bill by ID
   * @param {string} billId - Bill ID
   * @returns {Object} Bill details with appointment and doctor info
   */
  getBillById(billId) {
    const bill = billingRepository.findById(billId);
    if (!bill) {
      throw new Error("Bill not found");
    }

    return this.enrichBillData(bill);
  }

  /**
   * Get bill by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Object} Bill details with appointment and doctor info
   */
  getBillByAppointmentId(appointmentId) {
    const bill = billingRepository.findByAppointmentId(appointmentId);
    if (!bill) {
      return null;
    }

    return this.enrichBillData(bill);
  }

  /**
   * Get bills by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of bills with enriched data
   */
  getBillsByPatientId(patientId, filters = {}) {
    const bills = billingRepository.findByPatientId(patientId, filters);
    return bills.map((bill) => this.enrichBillData(bill));
  }

  /**
   * Get bills by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of bills with enriched data
   */
  getBillsByDoctorId(doctorId, filters = {}) {
    const bills = billingRepository.findByDoctorId(doctorId, filters);
    return bills.map((bill) => this.enrichBillData(bill));
  }

  /**
   * Update bill status
   * @param {string} billId - Bill ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data (paymentMethod, transactionRef)
   * @returns {Promise<BillingModel>} Updated bill
   */
  async updateBillStatus(billId, status, additionalData = {}) {
    const bill = billingRepository.findById(billId);
    if (!bill) {
      throw new Error("Bill not found");
    }

    // Validate status
    if (!Object.values(BILL_STATUS).includes(status)) {
      throw new Error("Invalid bill status");
    }

    const updates = {
      status,
      ...additionalData,
    };

    const updatedBill = await billingRepository.update(billId, updates);
    return updatedBill;
  }

  /**
   * Mark bill as paid
   * @param {string} billId - Bill ID
   * @param {string} paymentMethod - Payment method
   * @param {string} transactionRef - Transaction reference
   * @returns {Promise<BillingModel>} Updated bill
   */
  async markBillAsPaid(billId, paymentMethod, transactionRef) {
    return await this.updateBillStatus(billId, BILL_STATUS.PAID, {
      paymentMethod,
      transactionRef,
    });
  }

  /**
   * Enrich bill data with appointment and doctor information
   * @param {BillingModel} bill - Bill model
   * @returns {Object} Enriched bill data
   * @private
   */
  enrichBillData(bill) {
    const billData = bill.toJSON();

    // Get appointment details
    const appointment = appointmentRepository.findById(bill.appointmentId);
    if (appointment) {
      billData.appointment = {
        id: appointment.id,
        date: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        reason: appointment.reason,
      };
    }

    // Get doctor details
    const doctor = doctorRepository.findById(bill.doctorId);
    if (doctor) {
      billData.doctor = {
        id: doctor.id,
        name: doctor.fullName,
        specialization: doctor.qualification,
        consultationFee: doctor.consultationFee,
      };
    }

    // Get patient details
    const patient = patientRepository.findById(bill.patientId);
    if (patient) {
      billData.patient = {
        id: patient.id,
        name: patient.fullName,
        phone: patient.phone,
      };
    }

    return billData;
  }

  /**
   * Get billing statistics for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} dateRange - Date range filters
   * @returns {Object} Billing statistics
   */
  getDoctorBillingStats(doctorId, dateRange = {}) {
    const bills = billingRepository.findByDoctorId(doctorId, dateRange);

    const stats = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
      paidBills: bills.filter((bill) => bill.status === BILL_STATUS.PAID)
        .length,
      paidAmount: bills
        .filter((bill) => bill.status === BILL_STATUS.PAID)
        .reduce((sum, bill) => sum + bill.amount, 0),
      pendingBills: bills.filter((bill) => bill.status === BILL_STATUS.PENDING)
        .length,
      pendingAmount: bills
        .filter((bill) => bill.status === BILL_STATUS.PENDING)
        .reduce((sum, bill) => sum + bill.amount, 0),
    };

    return stats;
  }

  /**
   * Get billing statistics for a patient
   * @param {string} patientId - Patient ID
   * @param {Object} dateRange - Date range filters
   * @returns {Object} Billing statistics
   */
  getPatientBillingStats(patientId, dateRange = {}) {
    const bills = billingRepository.findByPatientId(patientId, dateRange);

    const stats = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
      paidBills: bills.filter((bill) => bill.status === BILL_STATUS.PAID)
        .length,
      paidAmount: bills
        .filter((bill) => bill.status === BILL_STATUS.PAID)
        .reduce((sum, bill) => sum + bill.amount, 0),
      pendingBills: bills.filter((bill) => bill.status === BILL_STATUS.PENDING)
        .length,
      pendingAmount: bills
        .filter((bill) => bill.status === BILL_STATUS.PENDING)
        .reduce((sum, bill) => sum + bill.amount, 0),
    };

    return stats;
  }
}

module.exports = new BillingService();
