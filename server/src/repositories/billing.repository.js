/**
 * Billing Repository
 * Handles all data access operations for bills using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { BillingModel } = require("../models/billing.model");

class BillingRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/bills.json");
    this.bills = []; // In-memory cache
  }

  /**
   * Load all bills from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.bills = data.map((b) => new BillingModel(b));
      console.log(`✓ Loaded ${this.bills.length} bills into memory`);
    } catch (error) {
      console.error("Error loading bills:", error.message);
      this.bills = [];
    }
  }

  /**
   * Save all bills to JSON file
   * @private
   */
  async saveData() {
    const data = this.bills.map((b) => b.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all bills
   * @returns {BillingModel[]} Array of all bills
   */
  getAll() {
    return this.bills;
  }

  /**
   * Find bill by ID
   * @param {string} id - Bill ID
   * @returns {BillingModel|null} Bill or null if not found
   */
  findById(id) {
    return this.bills.find((b) => b.id === id) || null;
  }

  /**
   * Find bills by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @returns {BillingModel|null} Bill or null if not found
   */
  findByAppointmentId(appointmentId) {
    return this.bills.find((b) => b.appointmentId === appointmentId) || null;
  }

  /**
   * Find bills by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} filters - Optional filters
   * @returns {BillingModel[]} Array of bills
   */
  findByPatientId(patientId, filters = {}) {
    let result = this.bills.filter((b) => b.patientId === patientId);

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        result = result.filter((b) => filters.status.includes(b.status));
      } else {
        result = result.filter((b) => b.status === filters.status);
      }
    }

    // Apply date filters
    if (filters.startDate) {
      result = result.filter((b) => b.createdAt >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter((b) => b.createdAt <= filters.endDate);
    }

    return result;
  }

  /**
   * Find bills by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {BillingModel[]} Array of bills
   */
  findByDoctorId(doctorId, filters = {}) {
    let result = this.bills.filter((b) => b.doctorId === doctorId);

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        result = result.filter((b) => filters.status.includes(b.status));
      } else {
        result = result.filter((b) => b.status === filters.status);
      }
    }

    // Apply date filters
    if (filters.startDate) {
      result = result.filter((b) => b.createdAt >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter((b) => b.createdAt <= filters.endDate);
    }

    return result;
  }

  /**
   * Create a new bill
   * @param {Object} billData - Bill data
   * @returns {Promise<BillingModel>} Created bill
   */
  async create(billData) {
    const bill = new BillingModel(billData);

    // Add to in-memory array
    this.bills.push(bill);

    // Persist to file
    await this.saveData();

    return bill;
  }

  /**
   * Update an existing bill
   * @param {string} id - Bill ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<BillingModel|null>} Updated bill or null if not found
   */
  async update(id, updates) {
    const index = this.bills.findIndex((b) => b.id === id);
    if (index === -1) {
      return null;
    }

    // Update bill data
    const updatedData = {
      ...this.bills[index].toJSON(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.bills[index] = new BillingModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.bills[index];
  }

  /**
   * Delete a bill
   * @param {string} id - Bill ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const index = this.bills.findIndex((b) => b.id === id);
    if (index === -1) {
      return false;
    }

    // Remove from in-memory array
    this.bills.splice(index, 1);

    // Persist to file
    await this.saveData();

    return true;
  }
}

// Export singleton instance
module.exports = new BillingRepository();
