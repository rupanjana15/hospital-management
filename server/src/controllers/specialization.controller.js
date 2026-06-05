/**
 * Specialization Controller
 * Handles HTTP requests for specialization operations
 */

const specializationRepository = require("../repositories/specialization.repository");
const specializationService = require("../services/specialization.service");

/**
 * Get all specializations
 * @route GET /api/specializations
 */
async function getAllSpecializations(req, res) {
  try {
    const specializations = specializationRepository.getAll();

    return res.status(200).json({
      success: true,
      data: {
        specializations: specializations,
        count: specializations.length,
      },
    });
  } catch (error) {
    console.error("Error fetching specializations:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching specializations",
        },
      ],
    });
  }
}

/**
 * Get all active specializations
 * @route GET /api/specializations/active
 */
async function getActiveSpecializations(req, res) {
  try {
    const specializations = specializationRepository.getAllActive();

    return res.status(200).json({
      success: true,
      data: {
        specializations: specializations,
        count: specializations.length,
      },
    });
  } catch (error) {
    console.error("Error fetching active specializations:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching active specializations",
        },
      ],
    });
  }
}

/**
 * Get specialization by ID
 * @route GET /api/specializations/:id
 */
async function getSpecializationById(req, res) {
  try {
    const { id } = req.params;
    const specialization = specializationRepository.findById(id);

    if (!specialization) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "Specialization not found",
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        specialization: specialization,
      },
    });
  } catch (error) {
    console.error("Error fetching specialization:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching specialization",
        },
      ],
    });
  }
}

/**
 * Create a new specialization
 * @route POST /api/specializations
 * @access ADMIN only
 */
async function createSpecialization(req, res) {
  try {
    const { name, description } = req.body;
    const adminId = req.user.userId;

    const specialization = await specializationService.createSpecialization(
      { name, description },
      adminId
    );

    return res.status(201).json({
      success: true,
      message: "Specialization created successfully",
      data: {
        specialization: specialization,
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "DUPLICATE_NAME") {
      return res.status(409).json({
        success: false,
        errors: [
          {
            field: "name",
            message: "Specialization with this name already exists",
          },
        ],
      });
    }

    if (error.code === "INVALID_NAME_LENGTH") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "name",
            message: error.message,
          },
        ],
      });
    }

    if (error.code === "INVALID_DESCRIPTION_LENGTH") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "description",
            message: error.message,
          },
        ],
      });
    }

    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        success: false,
        errors: error.validationErrors.map((err) => ({
          field: "general",
          message: err,
        })),
      });
    }

    // Generic server error
    console.error("Error creating specialization:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while creating specialization",
        },
      ],
    });
  }
}

/**
 * Update a specialization
 * @route PUT /api/specializations/:id
 * @access ADMIN only
 */
async function updateSpecialization(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;
    const updateData = req.body;

    const specialization = await specializationService.updateSpecialization(
      id,
      updateData,
      adminId
    );

    return res.status(200).json({
      success: true,
      message: "Specialization updated successfully",
      data: {
        specialization: specialization,
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "SPECIALIZATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "Specialization not found",
          },
        ],
      });
    }

    if (error.code === "DUPLICATE_NAME") {
      return res.status(409).json({
        success: false,
        errors: [
          {
            field: "name",
            message: "Another specialization with this name already exists",
          },
        ],
      });
    }

    if (error.code === "DUPLICATE_ID") {
      return res.status(409).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "A specialization with this ID already exists",
          },
        ],
      });
    }

    if (error.code === "INVALID_NAME_LENGTH") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "name",
            message: error.message,
          },
        ],
      });
    }

    if (error.code === "INVALID_DESCRIPTION_LENGTH") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "description",
            message: error.message,
          },
        ],
      });
    }

    // Generic server error
    console.error("Error updating specialization:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while updating specialization",
        },
      ],
    });
  }
}

/**
 * Delete a specialization (soft delete)
 * @route DELETE /api/specializations/:id
 * @access ADMIN only
 */
async function deleteSpecialization(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const specialization = await specializationService.deleteSpecialization(
      id,
      adminId
    );

    return res.status(200).json({
      success: true,
      message: "Specialization deleted successfully",
      data: {
        specialization: specialization,
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "SPECIALIZATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "Specialization not found",
          },
        ],
      });
    }

    if (error.code === "SPECIALIZATION_IN_USE") {
      return res.status(409).json({
        success: false,
        errors: [
          {
            field: "general",
            message: `Cannot delete specialization: ${error.doctorCount} doctor(s) are currently using this specialization`,
          },
        ],
      });
    }

    // Generic server error
    console.error("Error deleting specialization:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while deleting specialization",
        },
      ],
    });
  }
}

module.exports = {
  getAllSpecializations,
  getActiveSpecializations,
  getSpecializationById,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
};
