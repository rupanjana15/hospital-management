/**
 * Appointment Repository
 * Handles all data access operations for appointments using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { AppointmentModel } = require("../models/appointment.model");

class AppointmentRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/appointments.json");
    this.appointments = []; // In-memory cache
  }

  /**
   * Load all appointments from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.appointments = data.map((a) => new AppointmentModel(a));
      console.log(
        `✓ Loaded ${this.appointments.length} appointments into memory`
      );
    } catch (error) {
      console.error("Error loading appointments:", error.message);
      this.appointments = [];
    }
  }

  /**
   * Save all appointments to JSON file
   * @private
   */
  async saveData() {
    const data = this.appointments.map((a) => a.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all appointments
   * @returns {AppointmentModel[]} Array of all appointments
   */
  getAll() {
    return this.appointments;
  }

  /**
   * Find appointment by ID
   * @param {string} id - Appointment ID
   * @returns {AppointmentModel|null} Appointment or null if not found
   */
  findById(id) {
    return this.appointments.find((a) => a.id === id) || null;
  }

  /**
   * Find appointments by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} filters - Optional filters
   * @returns {AppointmentModel[]} Array of appointments
   */
  findByPatientId(patientId, filters = {}) {
    let result = this.appointments.filter((a) => a.patientId === patientId);

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        result = result.filter((a) => filters.status.includes(a.status));
      } else {
        result = result.filter((a) => a.status === filters.status);
      }
    }

    // Apply date filters
    if (filters.startDate) {
      result = result.filter((a) => a.appointmentDate >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter((a) => a.appointmentDate <= filters.endDate);
    }

    // Sort by date and time descending (newest first)
    result.sort((a, b) => {
      const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return b.startTime.localeCompare(a.startTime);
    });

    return result;
  }

  /**
   * Find appointments by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {AppointmentModel[]} Array of appointments
   */
  findByDoctorId(doctorId, filters = {}) {
    let result = this.appointments.filter((a) => a.doctorId === doctorId);

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        result = result.filter((a) => filters.status.includes(a.status));
      } else {
        result = result.filter((a) => a.status === filters.status);
      }
    }

    // Apply date filters
    if (filters.startDate) {
      result = result.filter((a) => a.appointmentDate >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter((a) => a.appointmentDate <= filters.endDate);
    }

    // Sort by date and time descending
    result.sort((a, b) => {
      const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return b.startTime.localeCompare(a.startTime);
    });

    return result;
  }

  /**
   * Find appointment by slot ID
   * @param {string} slotId - Slot ID
   * @returns {AppointmentModel|null} Appointment or null if not found
   */
  findBySlotId(slotId) {
    return this.appointments.find((a) => a.slotId === slotId) || null;
  }

  /**
   * Find appointments requiring action (reschedule/cancel)
   * @param {string} patientId - Patient ID
   * @returns {AppointmentModel[]} Array of appointments requiring action
   */
  findRequiringAction(patientId) {
    return this.appointments.filter(
      (a) => a.patientId === patientId && a.requiresAction === true
    );
  }

  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<AppointmentModel>} Created appointment
   */
  async create(appointmentData) {
    const appointment = new AppointmentModel(appointmentData);

    // Add to in-memory array
    this.appointments.push(appointment);

    // Persist to file
    await this.saveData();

    return appointment;
  }

  /**
   * Update an existing appointment
   * @param {string} id - Appointment ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<AppointmentModel|null>} Updated appointment or null if not found
   */
  async update(id, updates) {
    const index = this.appointments.findIndex((a) => a.id === id);
    if (index === -1) {
      return null;
    }

    // Update appointment data
    const updatedData = {
      ...this.appointments[index].toJSON(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.appointments[index] = new AppointmentModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.appointments[index];
  }

  /**
   * Update multiple appointments at once
   * @param {Array<{id: string, updates: Object}>} updatesList - Array of appointment updates
   * @returns {Promise<AppointmentModel[]>} Updated appointments
   */
  async updateMany(updatesList) {
    const updatedAppointments = [];

    for (const { id, updates } of updatesList) {
      const index = this.appointments.findIndex((a) => a.id === id);
      if (index !== -1) {
        const updatedData = {
          ...this.appointments[index].toJSON(),
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.appointments[index] = new AppointmentModel(updatedData);
        updatedAppointments.push(this.appointments[index]);
      }
    }

    // Persist to file
    await this.saveData();

    return updatedAppointments;
  }

  /**
   * Delete an appointment (update status to CANCELLED)
   * @param {string} id - Appointment ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const appointment = this.findById(id);
    if (!appointment) {
      return false;
    }

    await this.update(id, { status: "CANCELLED" });
    return true;
  }
}

// Export singleton instance
module.exports = new AppointmentRepository();
