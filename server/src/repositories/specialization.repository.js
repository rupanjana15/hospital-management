/**
 * Specialization Repository
 * Handles all data access operations for specializations using JSON file storage
 */

const path = require("path");
const { readJSONFile } = require("../utils/fileHandler");

class SpecializationRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/specializations.json");
    this.specializations = []; // In-memory cache
  }

  /**
   * Load all specializations from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.specializations = data;
      console.log(
        `✓ Loaded ${this.specializations.length} specializations into memory`
      );
    } catch (error) {
      console.error("Error loading specializations:", error.message);
      this.specializations = [];
    }
  }

  /**
   * Get all specializations
   * @returns {Array} Array of all specializations
   */
  getAll() {
    return this.specializations;
  }

  /**
   * Get all active specializations
   * @returns {Array} Array of active specializations
   */
  getAllActive() {
    return this.specializations.filter((s) => s.isActive === true);
  }

  /**
   * Find specialization by ID
   * @param {string} id - Specialization ID
   * @returns {Object|null} Specialization or null if not found
   */
  findById(id) {
    return this.specializations.find((s) => s.id === id) || null;
  }

  /**
   * Check if specialization ID is valid and active
   * @param {string} id - Specialization ID
   * @returns {boolean} True if valid and active, false otherwise
   */
  isValidAndActive(id) {
    const specialization = this.findById(id);
    return specialization !== null && specialization.isActive === true;
  }

  /**
   * Find specialization by name (case-insensitive)
   * @param {string} name - Specialization name
   * @returns {Object|null} Specialization or null if not found
   */
  findByName(name) {
    const normalizedName = name.toLowerCase();
    return (
      this.specializations.find(
        (s) => s.name.toLowerCase() === normalizedName
      ) || null
    );
  }

  /**
   * Create a new specialization
   * @param {Object} specialization - Specialization data
   * @returns {Promise<Object>} Created specialization
   */
  async create(specialization) {
    const { writeJSONFile } = require("../utils/fileHandler");

    // Add to in-memory cache
    this.specializations.push(specialization);

    // Write to file
    await writeJSONFile(this.filePath, this.specializations);

    return specialization;
  }

  /**
   * Update a specialization
   * @param {string} id - Specialization ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated specialization
   */
  async update(id, updateData) {
    const { writeJSONFile } = require("../utils/fileHandler");

    // Find specialization index
    const index = this.specializations.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Specialization not found");
    }

    // If ID is being changed, update the ID
    const oldId = id;
    const newId = updateData.id || id;

    // Update in-memory cache
    this.specializations[index] = {
      ...this.specializations[index],
      ...updateData,
    };

    // If ID changed, we need to handle the update specially
    if (oldId !== newId) {
      // Remove old entry
      this.specializations.splice(index, 1);
      // Add with new ID
      this.specializations.push(this.specializations[index]);

      // Re-find with new ID
      const newIndex = this.specializations.findIndex((s) => s.id === newId);
      if (newIndex !== -1) {
        this.specializations[newIndex] = {
          ...this.specializations[newIndex],
          ...updateData,
        };
      }
    }

    // Write to file
    await writeJSONFile(this.filePath, this.specializations);

    // Return updated specialization
    return this.findById(newId);
  }

  /**
   * Delete a specialization (soft delete)
   * @param {string} id - Specialization ID
   * @returns {Promise<Object>} Deleted specialization
   */
  async delete(id) {
    return this.update(id, { isActive: false });
  }
}

// Export singleton instance
module.exports = new SpecializationRepository();
