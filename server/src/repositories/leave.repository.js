/**
 * Leave Repository
 * Handles all data access operations for leaves using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { LeaveModel } = require("../models/leave.model");

class LeaveRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/leaves.json");
    this.leaves = []; // In-memory cache
  }

  /**
   * Load all leaves from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.leaves = data.map((l) => new LeaveModel(l));
      console.log(`✓ Loaded ${this.leaves.length} leaves into memory`);
    } catch (error) {
      console.error("Error loading leaves:", error.message);
      this.leaves = [];
    }
  }

  /**
   * Save all leaves to JSON file
   * @private
   */
  async saveData() {
    const data = this.leaves.map((l) => l.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all leaves
   * @returns {LeaveModel[]} Array of all leaves
   */
  getAll() {
    return this.leaves;
  }

  /**
   * Find leave by ID
   * @param {string} id - Leave ID
   * @returns {LeaveModel|null} Leave or null if not found
   */
  findById(id) {
    return this.leaves.find((l) => l.id === id) || null;
  }

  /**
   * Find leaves by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {LeaveModel[]} Array of leaves
   */
  findByDoctorId(doctorId, filters = {}) {
    let result = this.leaves.filter((l) => l.doctorId === doctorId);

    // Apply status filter
    if (filters.status) {
      result = result.filter((l) => l.status === filters.status);
    }

    // Apply date filters
    if (filters.startDate) {
      result = result.filter((l) => l.endDate >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter((l) => l.startDate <= filters.endDate);
    }

    return result;
  }

  /**
   * Find approved leaves for a doctor in a date range
   * @param {string} doctorId - Doctor ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {LeaveModel[]} Array of approved leaves
   */
  findApprovedLeaves(doctorId, startDate, endDate) {
    return this.leaves.filter(
      (l) =>
        l.doctorId === doctorId &&
        l.status === "APPROVED" &&
        l.endDate >= startDate &&
        l.startDate <= endDate
    );
  }

  /**
   * Create a new leave
   * @param {Object} leaveData - Leave data
   * @returns {Promise<LeaveModel>} Created leave
   */
  async create(leaveData) {
    const leave = new LeaveModel(leaveData);

    // Add to in-memory array
    this.leaves.push(leave);

    // Persist to file
    await this.saveData();

    return leave;
  }

  /**
   * Update an existing leave
   * @param {string} id - Leave ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<LeaveModel|null>} Updated leave or null if not found
   */
  async update(id, updates) {
    const index = this.leaves.findIndex((l) => l.id === id);
    if (index === -1) {
      return null;
    }

    // Update leave data
    const updatedData = {
      ...this.leaves[index].toJSON(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.leaves[index] = new LeaveModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.leaves[index];
  }

  /**
   * Delete a leave (soft delete by setting status to CANCELLED)
   * @param {string} id - Leave ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const leave = this.findById(id);
    if (!leave) {
      return false;
    }

    await this.update(id, { status: "CANCELLED" });
    return true;
  }
}

// Export singleton instance
module.exports = new LeaveRepository();
