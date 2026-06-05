/**
 * Specialization Service
 * Business logic for specialization operations
 */

const { v4: uuidv4 } = require("uuid");
const specializationRepository = require("../repositories/specialization.repository");
const doctorRepository = require("../repositories/doctor.repository");
const auditLogRepository = require("../repositories/auditLog.repository");
const { SpecializationModel } = require("../models/specialization.model");

class SpecializationService {
  /**
   * Get all specializations
   * @returns {SpecializationModel[]} Array of all specializations
   */
  getAllSpecializations() {
    return specializationRepository.getAll();
  }

  /**
   * Get all active specializations
   * @returns {SpecializationModel[]} Array of active specializations
   */
  getActiveSpecializations() {
    return specializationRepository.getAllActive();
  }

  /**
   * Get specialization by ID
   * @param {string} id - Specialization ID
   * @returns {SpecializationModel|null} Specialization or null if not found
   */
  getSpecializationById(id) {
    return specializationRepository.findById(id);
  }

  /**
   * Create a new specialization
   * @param {Object} specializationData - Specialization data
   * @param {string} specializationData.name - Specialization name
   * @param {string} specializationData.description - Description
   * @param {boolean} [specializationData.isActive=true] - Active status
   * @param {string} adminId - Admin ID performing the action
   * @returns {Promise<SpecializationModel>} Created specialization
   * @throws {Error} If validation fails or duplicate exists
   */
  async createSpecialization(specializationData, adminId) {
    const { name, description, isActive = true } = specializationData;

    // 1. Normalize and trim inputs
    const trimmedName = name.trim();
    const trimmedDescription = description ? description.trim() : "";

    // 2. Check for duplicate name
    const existingSpecialization =
      specializationRepository.findByName(trimmedName);
    if (existingSpecialization) {
      const error = new Error("Specialization name already exists");
      error.code = "DUPLICATE_NAME";
      throw error;
    }

    // 3. Validate name length
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      const error = new Error(
        "Specialization name must be between 2 and 100 characters"
      );
      error.code = "INVALID_NAME_LENGTH";
      throw error;
    }

    // 4. Validate description length if provided
    if (trimmedDescription && trimmedDescription.length > 500) {
      const error = new Error("Description must not exceed 500 characters");
      error.code = "INVALID_DESCRIPTION_LENGTH";
      throw error;
    }

    // 5. Generate unique ID
    const id = `spec_${uuidv4().substring(0, 8)}`;

    // 6. Prepare specialization data
    const newSpecializationData = {
      id,
      name: trimmedName,
      description: trimmedDescription,
      isActive,
    };

    // 7. Create SpecializationModel instance
    const specialization = new SpecializationModel(newSpecializationData);

    // 8. Validate model
    const validation = specialization.validate();
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(", "));
      error.code = "VALIDATION_ERROR";
      error.validationErrors = validation.errors;
      throw error;
    }

    // 9. Save to repository
    const createdSpecialization = await specializationRepository.create(
      specialization
    );

    // 10. Log audit event
    await auditLogRepository.create({
      action: "SPECIALIZATION_CREATE",
      performedBy: adminId,
      performedByRole: "ADMIN",
      targetType: "SPECIALIZATION",
      targetId: id,
      details: {
        specializationName: trimmedName,
        description: trimmedDescription,
        isActive,
      },
      ipAddress: null,
      userAgent: null,
    });

    return createdSpecialization;
  }

  /**
   * Update specialization
   * @param {string} id - Specialization ID
   * @param {Object} updateData - Update data
   * @param {string} adminId - Admin ID performing the action
   * @returns {Promise<SpecializationModel>} Updated specialization
   * @throws {Error} If specialization not found or validation fails
   */
  async updateSpecialization(id, updateData, adminId) {
    // 1. Find specialization
    const specialization = specializationRepository.findById(id);
    if (!specialization) {
      const error = new Error("Specialization not found");
      error.code = "SPECIALIZATION_NOT_FOUND";
      throw error;
    }

    // 2. Store old values for audit log
    const oldValues = {
      id: specialization.id,
      name: specialization.name,
      description: specialization.description,
      isActive: specialization.isActive,
    };

    // 3. Prepare update data (only allowed fields)
    const allowedFields = ["id", "name", "description", "isActive"];
    const sanitizedData = {};
    const changedFields = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        let value = updateData[field];

        // Trim string fields
        if (field === "name" || field === "description") {
          value = value ? value.trim() : value;
        }

        sanitizedData[field] = value;

        // Track changed fields
        if (value !== specialization[field]) {
          changedFields[field] = {
            oldValue: specialization[field],
            newValue: value,
          };
        }
      }
    }

    // 4. If ID is being changed, check for conflicts
    if (sanitizedData.id && sanitizedData.id !== id) {
      const existingWithNewId = specializationRepository.findById(
        sanitizedData.id
      );
      if (existingWithNewId) {
        const error = new Error("A specialization with this ID already exists");
        error.code = "DUPLICATE_ID";
        throw error;
      }
    }

    // 5. If name is being changed, check for duplicates
    if (sanitizedData.name && sanitizedData.name !== specialization.name) {
      const existingWithName = specializationRepository.findByName(
        sanitizedData.name
      );
      if (existingWithName && existingWithName.id !== id) {
        const error = new Error("Specialization name already exists");
        error.code = "DUPLICATE_NAME";
        throw error;
      }

      // Validate name length
      if (sanitizedData.name.length < 2 || sanitizedData.name.length > 100) {
        const error = new Error(
          "Specialization name must be between 2 and 100 characters"
        );
        error.code = "INVALID_NAME_LENGTH";
        throw error;
      }
    }

    // 6. Validate description length if being updated
    if (
      sanitizedData.description !== undefined &&
      sanitizedData.description &&
      sanitizedData.description.length > 500
    ) {
      const error = new Error("Description must not exceed 500 characters");
      error.code = "INVALID_DESCRIPTION_LENGTH";
      throw error;
    }

    // 7. Update specialization
    const updatedSpecialization = await specializationRepository.update(
      id,
      sanitizedData
    );

    // 8. Log audit event
    await auditLogRepository.create({
      action: "SPECIALIZATION_UPDATE",
      performedBy: adminId,
      performedByRole: "ADMIN",
      targetType: "SPECIALIZATION",
      targetId: sanitizedData.id || id,
      details: {
        oldValues,
        newValues: sanitizedData,
        changedFields,
      },
      ipAddress: null,
      userAgent: null,
    });

    return updatedSpecialization;
  }

  /**
   * Delete specialization (soft delete by setting isActive to false)
   * @param {string} id - Specialization ID
   * @param {string} adminId - Admin ID performing the action
   * @returns {Promise<SpecializationModel>} Deleted specialization
   * @throws {Error} If specialization not found or in use by doctors
   */
  async deleteSpecialization(id, adminId) {
    // 1. Find specialization
    const specialization = specializationRepository.findById(id);
    if (!specialization) {
      const error = new Error("Specialization not found");
      error.code = "SPECIALIZATION_NOT_FOUND";
      throw error;
    }

    // 2. Check if any doctors are using this specialization
    const doctorsUsingSpecialization =
      doctorRepository.findBySpecialization(id);
    if (doctorsUsingSpecialization && doctorsUsingSpecialization.length > 0) {
      const error = new Error(
        `Cannot delete specialization. ${doctorsUsingSpecialization.length} doctor(s) are currently using this specialization.`
      );
      error.code = "SPECIALIZATION_IN_USE";
      error.doctorCount = doctorsUsingSpecialization.length;
      throw error;
    }

    // 3. Soft delete - set isActive to false
    const deletedSpecialization = await specializationRepository.update(id, {
      isActive: false,
    });

    // 4. Log audit event
    await auditLogRepository.create({
      action: "SPECIALIZATION_DELETE",
      performedBy: adminId,
      performedByRole: "ADMIN",
      targetType: "SPECIALIZATION",
      targetId: id,
      details: {
        specializationName: specialization.name,
        description: specialization.description,
        wasActive: specialization.isActive,
      },
      ipAddress: null,
      userAgent: null,
    });

    return deletedSpecialization;
  }
}

module.exports = new SpecializationService();
