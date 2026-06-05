/**
 * Doctor Repository
 * Handles all data access operations for doctors using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { DoctorModel } = require("../models/doctor.model");

class DoctorRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/doctors.json");
    this.doctors = []; // In-memory cache
  }

  /**
   * Load all doctors from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.doctors = data.map((d) => new DoctorModel(d));
      console.log(`✓ Loaded ${this.doctors.length} doctors into memory`);
    } catch (error) {
      console.error("Error loading doctors:", error.message);
      this.doctors = [];
    }
  }

  /**
   * Save all doctors to JSON file
   * @private
   */
  async saveData() {
    const data = this.doctors.map((d) => d.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all doctors
   * @returns {DoctorModel[]} Array of all doctors
   */
  getAll() {
    return this.doctors;
  }

  /**
   * Get all approved doctors
   * @returns {DoctorModel[]} Array of approved doctors
   */
  getAllApproved() {
    return this.doctors.filter((d) => d.status === "APPROVED");
  }

  /**
   * Find doctor by ID
   * @param {string} id - Doctor ID
   * @returns {DoctorModel|null} Doctor or null if not found
   */
  findById(id) {
    return this.doctors.find((d) => d.id === id) || null;
  }

  /**
   * Find doctor by email (case-insensitive)
   * @param {string} email - Doctor email
   * @returns {DoctorModel|null} Doctor or null if not found
   */
  findByEmail(email) {
    const normalizedEmail = email.toLowerCase();
    return this.doctors.find((d) => d.email === normalizedEmail) || null;
  }

  /**
   * Find doctor by phone
   * @param {string} phone - Doctor phone number
   * @returns {DoctorModel|null} Doctor or null if not found
   */
  findByPhone(phone) {
    return this.doctors.find((d) => d.phone === phone) || null;
  }

  /**
   * Find doctors by specialization
   * @param {string} specializationId - Specialization ID
   * @returns {DoctorModel[]} Array of doctors with the specialization
   */
  findBySpecialization(specializationId) {
    return this.doctors.filter((d) => d.specializationId === specializationId);
  }

  /**
   * Create a new doctor
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<DoctorModel>} Created doctor
   */
  async create(doctorData) {
    const doctor = new DoctorModel(doctorData);

    // Add to in-memory array
    this.doctors.push(doctor);

    // Persist to file
    await this.saveData();

    return doctor;
  }

  /**
   * Update an existing doctor
   * @param {string} id - Doctor ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<DoctorModel|null>} Updated doctor or null if not found
   */
  async update(id, updates) {
    const index = this.doctors.findIndex((d) => d.id === id);
    if (index === -1) {
      return null;
    }

    // Update doctor data
    const updatedData = {
      ...this.doctors[index].toJSON(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.doctors[index] = new DoctorModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.doctors[index];
  }

  /**
   * Delete a doctor (soft delete by setting status to INACTIVE)
   * @param {string} id - Doctor ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const doctor = this.findById(id);
    if (!doctor) {
      return false;
    }

    return await this.update(id, { status: "INACTIVE" });
  }
}

// Export singleton instance
module.exports = new DoctorRepository();
