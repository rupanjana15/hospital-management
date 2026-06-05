/**
 * Slot Service
 * Business logic for slot management
 */

const { v4: uuidv4 } = require("uuid");
const slotRepository = require("../repositories/slot.repository");
const doctorRepository = require("../repositories/doctor.repository");
const { SlotModel, SLOT_STATUS } = require("../models/slot.model");

class SlotService {
  /**
   * Generate slot ID
   * @returns {string} Slot ID
   */
  generateSlotId() {
    return `slot_${uuidv4().split("-")[0]}`;
  }

  /**
   * Generate time slots from a time range
   * @param {string} startTime - Start time (HH:mm)
   * @param {string} endTime - End time (HH:mm)
   * @param {number} durationMinutes - Slot duration in minutes
   * @returns {Array<{startTime: string, endTime: string}>} Array of time slots
   */
  generateTimeSlots(startTime, endTime, durationMinutes) {
    const slots = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMin = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + durationMinutes;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;

      slots.push({
        startTime: `${String(slotStartHour).padStart(2, "0")}:${String(
          slotStartMin
        ).padStart(2, "0")}`,
        endTime: `${String(slotEndHour).padStart(2, "0")}:${String(
          slotEndMin
        ).padStart(2, "0")}`,
      });

      currentMinutes += durationMinutes;
    }

    return slots;
  }

  /**
   * Create multiple slots for a doctor on a specific date
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {Array} slots - Array of slot objects with startTime and endTime
   * @returns {Promise<Object>} Result with created slots
   */
  async createBulkSlots(doctorId, date, slots) {
    // Verify doctor exists and is approved
    const doctor = doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }
    if (doctor.status !== "APPROVED") {
      throw new Error("Only approved doctors can create slots");
    }

    // Validate date is not in the past
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate < today) {
      throw new Error("Cannot create slots for past dates");
    }

    // Check for existing slots on this date
    const existingSlots = slotRepository.findByDoctorAndDate(doctorId, date);

    // Validate each new slot
    const newSlots = [];
    for (const slotData of slots) {
      const slotModel = new SlotModel({
        id: this.generateSlotId(),
        doctorId,
        date,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        status: SLOT_STATUS.AVAILABLE,
        createdBy: doctorId,
      });

      // Validate slot
      const validation = slotModel.validate();
      if (!validation.isValid) {
        throw new Error(
          `Invalid slot ${slotData.startTime}-${
            slotData.endTime
          }: ${validation.errors.join(", ")}`
        );
      }

      // Check for overlaps with existing slots
      const hasOverlap = existingSlots.some((existing) =>
        slotModel.overlapsWith(existing)
      );
      if (hasOverlap) {
        throw new Error(
          `Slot ${slotData.startTime}-${slotData.endTime} overlaps with existing slot`
        );
      }

      // Check for overlaps within new slots
      const overlapInNew = newSlots.some((newSlot) =>
        slotModel.overlapsWith(newSlot)
      );
      if (overlapInNew) {
        throw new Error(
          `Slot ${slotData.startTime}-${slotData.endTime} overlaps with another new slot`
        );
      }

      newSlots.push(slotModel);
    }

    // Create all slots
    const createdSlots = await slotRepository.createMany(
      newSlots.map((s) => s.toJSON())
    );

    return {
      success: true,
      message: `Created ${createdSlots.length} slots for ${date}`,
      slots: createdSlots.map((s) => s.toPublicJSON()),
    };
  }

  /**
   * Create slots using quick helper (start/end time with duration)
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {string} startTime - Start time (HH:mm)
   * @param {string} endTime - End time (HH:mm)
   * @param {number} slotDurationMinutes - Slot duration in minutes
   * @returns {Promise<Object>} Result with created slots
   */
  async createQuickSlots(
    doctorId,
    date,
    startTime,
    endTime,
    slotDurationMinutes
  ) {
    // Generate time slots
    const timeSlots = this.generateTimeSlots(
      startTime,
      endTime,
      slotDurationMinutes
    );

    // Create bulk slots
    return await this.createBulkSlots(doctorId, date, timeSlots);
  }

  /**
   * Get doctor's slots for a date range
   * @param {string} doctorId - Doctor ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} status - Optional status filter
   * @returns {Object} Slots grouped by date
   */
  getDoctorSlots(doctorId, startDate, endDate, status = null) {
    const filters = { startDate, endDate };
    if (status) {
      filters.status = status;
    }

    const slots = slotRepository.findByDoctorId(doctorId, filters);

    // Group by date
    const groupedSlots = {};
    for (const slot of slots) {
      if (!groupedSlots[slot.date]) {
        groupedSlots[slot.date] = [];
      }
      groupedSlots[slot.date].push(slot.toPublicJSON());
    }

    return groupedSlots;
  }

  /**
   * Get available slots for patients to book
   * @param {string} doctorId - Doctor ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Object} Available slots grouped by date
   */
  getAvailableSlots(doctorId, startDate, endDate) {
    const slots = slotRepository.findAvailableSlots(
      doctorId,
      startDate,
      endDate
    );

    // Filter out past slots
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const futureSlots = slots.filter((slot) => {
      if (slot.date > today) return true;
      if (slot.date === today && slot.startTime > currentTime) return true;
      return false;
    });

    // Group by date
    const groupedSlots = {};
    for (const slot of futureSlots) {
      if (!groupedSlots[slot.date]) {
        groupedSlots[slot.date] = [];
      }
      groupedSlots[slot.date].push(slot.toPublicJSON());
    }

    return groupedSlots;
  }

  /**
   * Update a slot
   * @param {string} slotId - Slot ID
   * @param {string} doctorId - Doctor ID (for authorization)
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated slot
   */
  async updateSlot(slotId, doctorId, updates) {
    const slot = slotRepository.findById(slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    // Verify ownership
    if (slot.doctorId !== doctorId) {
      throw new Error("Unauthorized: You can only update your own slots");
    }

    // Don't allow updating booked slots
    if (slot.status === SLOT_STATUS.BOOKED) {
      throw new Error("Cannot update a booked slot");
    }

    const updatedSlot = await slotRepository.update(slotId, updates);
    return updatedSlot.toPublicJSON();
  }

  /**
   * Delete a slot
   * @param {string} slotId - Slot ID
   * @param {string} doctorId - Doctor ID (for authorization)
   * @returns {Promise<Object>} Result
   */
  async deleteSlot(slotId, doctorId) {
    const slot = slotRepository.findById(slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    // Verify ownership
    if (slot.doctorId !== doctorId) {
      throw new Error("Unauthorized: You can only delete your own slots");
    }

    // Don't allow deleting booked slots
    if (slot.status === SLOT_STATUS.BOOKED) {
      throw new Error(
        "Cannot delete a booked slot. Please cancel the appointment first."
      );
    }

    await slotRepository.delete(slotId);

    return {
      success: true,
      message: "Slot deleted successfully",
    };
  }

  /**
   * Delete multiple slots at once
   * @param {string} doctorId - Doctor ID (for authorization)
   * @param {Object} filters - Filters for which slots to delete
   * @param {string} filters.date - Specific date (YYYY-MM-DD)
   * @param {Array<string>} filters.slotIds - Array of slot IDs
   * @returns {Promise<Object>} Result with deletion summary
   */
  async deleteBulkSlots(doctorId, filters) {
    let slotsToDelete = [];

    // Get slots based on filters
    if (filters.date) {
      // Delete all slots for a specific date
      slotsToDelete = slotRepository.findByDoctorAndDate(
        doctorId,
        filters.date
      );
    } else if (filters.slotIds && Array.isArray(filters.slotIds)) {
      // Delete specific slot IDs
      slotsToDelete = filters.slotIds
        .map((id) => slotRepository.findById(id))
        .filter((slot) => slot !== null);
    } else {
      throw new Error("Either date or slotIds must be provided");
    }

    // Verify all slots belong to the doctor
    const unauthorizedSlots = slotsToDelete.filter(
      (slot) => slot.doctorId !== doctorId
    );
    if (unauthorizedSlots.length > 0) {
      throw new Error("Unauthorized: Some slots do not belong to you");
    }

    // Check for booked slots
    const bookedSlots = slotsToDelete.filter(
      (slot) => slot.status === SLOT_STATUS.BOOKED
    );
    if (bookedSlots.length > 0) {
      throw new Error(
        `Cannot delete ${bookedSlots.length} booked slot(s). Please cancel the appointments first.`
      );
    }

    // Delete all eligible slots
    const deletedCount = await slotRepository.deleteMany(
      slotsToDelete.map((slot) => slot.id)
    );

    return {
      success: true,
      message: `Successfully deleted ${deletedCount} slot(s)`,
      deletedCount,
    };
  }

  /**
   * Update status of multiple slots at once
   * @param {string} doctorId - Doctor ID (for authorization)
   * @param {Object} filters - Filters for which slots to update
   * @param {string} filters.date - Specific date (YYYY-MM-DD)
   * @param {Array<string>} filters.slotIds - Array of slot IDs
   * @param {string} newStatus - New status (AVAILABLE, BLOCKED)
   * @param {string} reason - Reason for status change (required for BLOCKED)
   * @returns {Promise<Object>} Result with update summary
   */
  async updateBulkSlotStatus(doctorId, filters, newStatus, reason = null) {
    // Validate status
    if (![SLOT_STATUS.AVAILABLE, SLOT_STATUS.BLOCKED].includes(newStatus)) {
      throw new Error("Status can only be changed to AVAILABLE or BLOCKED");
    }

    if (newStatus === SLOT_STATUS.BLOCKED && !reason) {
      throw new Error("Reason is required when blocking slots");
    }

    let slotsToUpdate = [];

    // Get slots based on filters
    if (filters.date) {
      // Update all slots for a specific date
      slotsToUpdate = slotRepository.findByDoctorAndDate(
        doctorId,
        filters.date
      );
    } else if (filters.slotIds && Array.isArray(filters.slotIds)) {
      // Update specific slot IDs
      slotsToUpdate = filters.slotIds
        .map((id) => slotRepository.findById(id))
        .filter((slot) => slot !== null);
    } else {
      throw new Error("Either date or slotIds must be provided");
    }

    // Verify all slots belong to the doctor
    const unauthorizedSlots = slotsToUpdate.filter(
      (slot) => slot.doctorId !== doctorId
    );
    if (unauthorizedSlots.length > 0) {
      throw new Error("Unauthorized: Some slots do not belong to you");
    }

    // Don't allow changing status of booked slots
    const bookedSlots = slotsToUpdate.filter(
      (slot) => slot.status === SLOT_STATUS.BOOKED
    );
    if (bookedSlots.length > 0) {
      throw new Error(
        `Cannot change status of ${bookedSlots.length} booked slot(s). Please handle appointments first.`
      );
    }

    // Prepare updates
    const updates = { status: newStatus };
    if (newStatus === SLOT_STATUS.BLOCKED) {
      updates.blockedReason = reason;
      updates.blockedAt = new Date().toISOString();
    } else if (newStatus === SLOT_STATUS.AVAILABLE) {
      updates.blockedReason = null;
      updates.blockedAt = null;
    }

    // Update all eligible slots
    const updatedSlots = await slotRepository.updateMany(
      slotsToUpdate.map((slot) => slot.id),
      updates
    );

    return {
      success: true,
      message: `Successfully updated ${updatedSlots.length} slot(s) to ${newStatus}`,
      updatedCount: updatedSlots.length,
      slots: updatedSlots.map((s) => s.toPublicJSON()),
    };
  }

  /**
   * Get slot details
   * @param {string} slotId - Slot ID
   * @returns {Object} Slot details
   */
  getSlotDetails(slotId) {
    const slot = slotRepository.findById(slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    return slot.toJSON();
  }
}

module.exports = new SlotService();
