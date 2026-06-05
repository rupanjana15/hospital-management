/**
 * Slot Repository
 * Handles all data access operations for slots using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { SlotModel } = require("../models/slot.model");

class SlotRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/slots.json");
    this.slots = []; // In-memory cache
  }

  /**
   * Load all slots from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.slots = data.map((s) => new SlotModel(s));
      console.log(`✓ Loaded ${this.slots.length} slots into memory`);
    } catch (error) {
      console.error("Error loading slots:", error.message);
      this.slots = [];
    }
  }

  /**
   * Save all slots to JSON file
   * @private
   */
  async saveData() {
    const data = this.slots.map((s) => s.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all slots
   * @returns {SlotModel[]} Array of all slots
   */
  getAll() {
    return this.slots;
  }

  /**
   * Find slot by ID
   * @param {string} id - Slot ID
   * @returns {SlotModel|null} Slot or null if not found
   */
  findById(id) {
    return this.slots.find((s) => s.id === id) || null;
  }

  /**
   * Find slots by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {SlotModel[]} Array of slots
   */
  findByDoctorId(doctorId, filters = {}) {
    let result = this.slots.filter((s) => s.doctorId === doctorId);

    // Apply date filters
    if (filters.startDate) {
      result = result.filter((s) => s.date >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter((s) => s.date <= filters.endDate);
    }

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        result = result.filter((s) => filters.status.includes(s.status));
      } else {
        result = result.filter((s) => s.status === filters.status);
      }
    }

    // Apply date filter
    if (filters.date) {
      result = result.filter((s) => s.date === filters.date);
    }

    return result;
  }

  /**
   * Find available slots by doctor ID and date range
   * @param {string} doctorId - Doctor ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {SlotModel[]} Array of available slots
   */
  findAvailableSlots(doctorId, startDate, endDate) {
    return this.slots.filter(
      (s) =>
        s.doctorId === doctorId &&
        s.date >= startDate &&
        s.date <= endDate &&
        s.status === "AVAILABLE"
    );
  }

  /**
   * Find slots by date and doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {SlotModel[]} Array of slots
   */
  findByDoctorAndDate(doctorId, date) {
    return this.slots.filter((s) => s.doctorId === doctorId && s.date === date);
  }

  /**
   * Check if slot overlaps with existing slots
   * @param {SlotModel} newSlot - New slot to check
   * @returns {boolean} True if overlaps, false otherwise
   */
  hasOverlap(newSlot) {
    return this.slots.some((existingSlot) => {
      // Skip if it's the same slot (for updates)
      if (newSlot.id && existingSlot.id === newSlot.id) {
        return false;
      }
      // Skip deleted slots
      if (existingSlot.status === "DELETED") {
        return false;
      }
      return newSlot.overlapsWith(existingSlot);
    });
  }

  /**
   * Create a new slot
   * @param {Object} slotData - Slot data
   * @returns {Promise<SlotModel>} Created slot
   */
  async create(slotData) {
    const slot = new SlotModel(slotData);

    // Add to in-memory array
    this.slots.push(slot);

    // Persist to file
    await this.saveData();

    return slot;
  }

  /**
   * Create multiple slots at once
   * @param {Array<Object>} slotsData - Array of slot data
   * @returns {Promise<SlotModel[]>} Created slots
   */
  async createMany(slotsData) {
    const newSlots = slotsData.map((data) => new SlotModel(data));

    // Add to in-memory array
    this.slots.push(...newSlots);

    // Persist to file
    await this.saveData();

    return newSlots;
  }

  /**
   * Update an existing slot
   * @param {string} id - Slot ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<SlotModel|null>} Updated slot or null if not found
   */
  async update(id, updates) {
    const index = this.slots.findIndex((s) => s.id === id);
    if (index === -1) {
      return null;
    }

    // Update slot data
    const updatedData = {
      ...this.slots[index].toJSON(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.slots[index] = new SlotModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.slots[index];
  }

  /**
   * Update multiple slots at once (overloaded method)
   * @param {Array<string>|Array<{id: string, updates: Object}>} slotIdsOrUpdatesList - Array of slot IDs or array of update objects
   * @param {Object} updates - Updates to apply (only if first param is array of IDs)
   * @returns {Promise<SlotModel[]>} Updated slots
   */
  async updateMany(slotIdsOrUpdatesList, updates = null) {
    const updatedSlots = [];

    // Handle two signatures:
    // 1. updateMany(slotIds[], updates) - apply same updates to all slot IDs
    // 2. updateMany([{id, updates}]) - apply individual updates to each slot

    if (updates !== null) {
      // Signature 1: Array of IDs with common updates
      const slotIds = slotIdsOrUpdatesList;
      for (const id of slotIds) {
        const index = this.slots.findIndex((s) => s.id === id);
        if (index !== -1) {
          const updatedData = {
            ...this.slots[index].toJSON(),
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          this.slots[index] = new SlotModel(updatedData);
          updatedSlots.push(this.slots[index]);
        }
      }
    } else {
      // Signature 2: Array of {id, updates} objects
      const updatesList = slotIdsOrUpdatesList;
      for (const { id, updates: itemUpdates } of updatesList) {
        const index = this.slots.findIndex((s) => s.id === id);
        if (index !== -1) {
          const updatedData = {
            ...this.slots[index].toJSON(),
            ...itemUpdates,
            updatedAt: new Date().toISOString(),
          };
          this.slots[index] = new SlotModel(updatedData);
          updatedSlots.push(this.slots[index]);
        }
      }
    }

    // Persist to file
    await this.saveData();

    return updatedSlots;
  }

  /**
   * Delete a slot (soft delete by setting status to DELETED)
   * @param {string} id - Slot ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const slot = this.findById(id);
    if (!slot) {
      return false;
    }

    await this.update(id, { status: "DELETED" });
    return true;
  }

  /**
   * Delete multiple slots at once (soft delete)
   * @param {Array<string>} slotIds - Array of slot IDs to delete
   * @returns {Promise<number>} Number of deleted slots
   */
  async deleteMany(slotIds) {
    let deletedCount = 0;

    for (const id of slotIds) {
      const success = await this.delete(id);
      if (success) deletedCount++;
    }

    return deletedCount;
  }

  /**
   * Hard delete a slot (permanent removal)
   * @param {string} id - Slot ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async hardDelete(id) {
    const index = this.slots.findIndex((s) => s.id === id);
    if (index === -1) {
      return false;
    }

    // Remove from in-memory array
    this.slots.splice(index, 1);

    // Persist to file
    await this.saveData();

    return true;
  }

  /**
   * Hard delete multiple slots (permanent removal)
   * @param {Array<string>} slotIds - Array of slot IDs to delete
   * @returns {Promise<number>} Number of deleted slots
   */
  async hardDeleteMany(slotIds) {
    let deletedCount = 0;

    for (const id of slotIds) {
      const success = await this.hardDelete(id);
      if (success) deletedCount++;
    }

    return deletedCount;
  }
}

// Export singleton instance
module.exports = new SlotRepository();
