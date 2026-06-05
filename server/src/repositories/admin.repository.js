/**
 * Admin Repository
 * Handles all data access operations for admins using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { AdminModel } = require("../models/admin.model");

class AdminRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/admins.json");
    this.admins = []; // In-memory cache
  }

  /**
   * Load all admins from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.admins = data.map((admin) => new AdminModel(admin));
      console.log(`✓ Loaded ${this.admins.length} admins into memory`);
    } catch (error) {
      console.error("Error loading admins:", error.message);
      this.admins = [];
    }
  }

  /**
   * Save all admins to JSON file
   * @private
   */
  async saveData() {
    const data = this.admins.map((a) => a.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all admins
   * @returns {AdminModel[]} Array of all admins
   */
  getAll() {
    return this.admins;
  }

  /**
   * Get all active admins
   * @returns {AdminModel[]} Array of active admins
   */
  getAllActive() {
    return this.admins.filter((a) => a.status === "ACTIVE");
  }

  /**
   * Find admin by ID
   * @param {string} id - Admin ID
   * @returns {AdminModel|null} Admin or null if not found
   */
  findById(id) {
    return this.admins.find((a) => a.id === id) || null;
  }

  /**
   * Find admin by email (case-insensitive)
   * @param {string} email - Admin email
   * @returns {AdminModel|null} Admin or null if not found
   */
  findByEmail(email) {
    const normalizedEmail = email.toLowerCase();
    return this.admins.find((a) => a.email === normalizedEmail) || null;
  }

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data
   * @returns {Promise<AdminModel>} Created admin
   */
  async create(adminData) {
    const admin = new AdminModel(adminData);

    // Add to in-memory array
    this.admins.push(admin);

    // Persist to file
    await this.saveData();

    return admin;
  }

  /**
   * Update an existing admin
   * @param {string} id - Admin ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<AdminModel|null>} Updated admin or null if not found
   */
  async update(id, updates) {
    const index = this.admins.findIndex((a) => a.id === id);
    if (index === -1) {
      return null;
    }

    // Update admin data
    const updatedData = {
      ...this.admins[index].toJSON(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.admins[index] = new AdminModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.admins[index];
  }

  /**
   * Delete an admin (soft delete by setting status to INACTIVE)
   * @param {string} id - Admin ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const admin = this.findById(id);
    if (!admin) {
      return false;
    }

    return await this.update(id, { status: "INACTIVE" });
  }
}

// Export singleton instance
module.exports = new AdminRepository();
