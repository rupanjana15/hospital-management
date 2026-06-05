/**
 * Patient Repository
 * Handles all data access operations for patients using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { PatientModel } = require("../models/patient.model");

class PatientRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/patients.json");
    this.patients = []; // In-memory cache
  }

  /**
   * Load all patients from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.patients = data.map((p) => new PatientModel(p));
      console.log(`✓ Loaded ${this.patients.length} patients into memory`);
    } catch (error) {
      console.error("Error loading patients:", error.message);
      this.patients = [];
    }
  }

  /**
   * Save all patients to JSON file
   * @private
   */
  async saveData() {
    const data = this.patients.map((p) => p.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all patients
   * @returns {PatientModel[]} Array of all patients
   */
  getAll() {
    return this.patients;
  }

  /**
   * Find patient by ID
   * @param {string} id - Patient ID
   * @returns {PatientModel|null} Patient or null if not found
   */
  findById(id) {
    return this.patients.find((p) => p.id === id) || null;
  }

  /**
   * Find patient by email (case-insensitive)
   * @param {string} email - Patient email
   * @returns {PatientModel|null} Patient or null if not found
   */
  findByEmail(email) {
    const normalizedEmail = email.toLowerCase();
    return this.patients.find((p) => p.email === normalizedEmail) || null;
  }

  /**
   * Find patient by phone
   * @param {string} phone - Patient phone number
   * @returns {PatientModel|null} Patient or null if not found
   */
  findByPhone(phone) {
    return this.patients.find((p) => p.phone === phone) || null;
  }

  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<PatientModel>} Created patient
   */
  async create(patientData) {
    const patient = new PatientModel(patientData);

    // Add to in-memory array
    this.patients.push(patient);

    // Persist to file
    await this.saveData();

    return patient;
  }

  /**
   * Update an existing patient
   * @param {string} id - Patient ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<PatientModel|null>} Updated patient or null if not found
   */
  async update(id, updates) {
    const index = this.patients.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }

    // Update patient data
    const updatedData = {
      ...this.patients[index].toJSON(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.patients[index] = new PatientModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.patients[index];
  }

  /**
   * Delete a patient (soft delete by setting status to DELETED)
   * @param {string} id - Patient ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const patient = this.findById(id);
    if (!patient) {
      return false;
    }

    return await this.update(id, { status: "DELETED" });
  }
}

// Export singleton instance
module.exports = new PatientRepository();
