/**
 * Doctor Controller
 * Handles HTTP requests for doctor operations
 */

const doctorService = require("../services/doctor.service");

/**
 * Register a new doctor
 * @route POST /api/doctors/register
 */
async function register(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      specializationId,
      qualification,
      experienceYears,
      consultationFee,
    } = req.body;

    // Call service to register doctor
    const doctor = await doctorService.registerDoctor({
      fullName,
      email,
      phone,
      password,
      specializationId,
      qualification,
      experienceYears,
      consultationFee,
    });

    // Return success response with sanitized doctor data
    return res.status(201).json({
      success: true,
      message:
        "Doctor registered successfully. Your account is pending admin approval.",
      data: {
        doctor: doctor.toPublicJSON(),
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(409).json({
        success: false,
        errors: [
          {
            field: "email",
            message: "Email already registered",
          },
        ],
      });
    }

    if (error.code === "DUPLICATE_PHONE") {
      return res.status(409).json({
        success: false,
        errors: [
          {
            field: "phone",
            message: "Phone number already registered",
          },
        ],
      });
    }

    if (error.code === "INVALID_PASSWORD") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "password",
            message: error.message,
          },
        ],
      });
    }

    if (error.code === "INVALID_SPECIALIZATION") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "specializationId",
            message: "Invalid or inactive specialization",
          },
        ],
      });
    }

    if (error.code === "INVALID_EXPERIENCE") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "experienceYears",
            message: error.message,
          },
        ],
      });
    }

    if (error.code === "INVALID_FEE") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "consultationFee",
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
    console.error("Error during doctor registration:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred during registration. Please try again.",
        },
      ],
    });
  }
}

/**
 * Get all doctors (Admin only)
 * @route GET /api/doctors
 */
async function getAllDoctors(req, res) {
  try {
    const doctors = doctorService.getAllDoctors();
    const publicDoctors = doctors.map((d) => d.toPublicJSON());

    return res.status(200).json({
      success: true,
      data: {
        doctors: publicDoctors,
        count: publicDoctors.length,
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching doctors",
        },
      ],
    });
  }
}

/**
 * Get doctor by ID
 * @route GET /api/doctors/:id
 */
async function getDoctorById(req, res) {
  try {
    const { id } = req.params;
    const doctor = doctorService.getDoctorById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "Doctor not found",
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        doctor: doctor.toPublicJSON(),
      },
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching doctor",
        },
      ],
    });
  }
}

/**
 * Get all approved doctors (Public access)
 * @route GET /api/doctors/approved
 */
async function getApprovedDoctors(req, res) {
  try {
    const doctors = doctorService.getAllApprovedDoctors();
    const publicDoctors = doctors.map((d) => d.toPublicJSON());

    return res.status(200).json({
      success: true,
      data: {
        doctors: publicDoctors,
        count: publicDoctors.length,
      },
    });
  } catch (error) {
    console.error("Error fetching approved doctors:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching doctors",
        },
      ],
    });
  }
}

/**
 * Update doctor status (PENDING -> APPROVED or REJECTED)
 * @route PATCH /api/doctors/:id/status
 */
async function updateDoctorStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.userId; // Admin ID from JWT token

    // Call service to update doctor status
    const updatedDoctor = await doctorService.updateDoctorStatus(
      id,
      status,
      adminId
    );

    return res.status(200).json({
      success: true,
      message: `Doctor status updated to ${status}`,
      data: {
        doctor: updatedDoctor.toPublicJSON(),
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "DOCTOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "Doctor not found",
          },
        ],
      });
    }

    if (error.code === "INVALID_STATUS_TRANSITION") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "status",
            message: error.message,
          },
        ],
      });
    }

    if (error.code === "INVALID_STATUS") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "status",
            message: error.message,
          },
        ],
      });
    }

    // Generic server error
    console.error("Error updating doctor status:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message:
            "An error occurred while updating doctor status. Please try again.",
        },
      ],
    });
  }
}

/**
 * Update current doctor's profile
 * @route PUT /api/doctors/me
 */
async function updateMyProfile(req, res) {
  try {
    const doctorId = req.user.userId; // Doctor ID from JWT token
    const updateData = req.body;

    // Call service to update doctor profile
    const updatedDoctor = await doctorService.updateMyProfile(
      doctorId,
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: {
        doctor: updatedDoctor.toPublicJSON(),
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "DOCTOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "general",
            message: "Doctor not found",
          },
        ],
      });
    }

    if (error.code === "DUPLICATE_PHONE") {
      return res.status(409).json({
        success: false,
        errors: [
          {
            field: "phone",
            message: "Phone number already registered",
          },
        ],
      });
    }

    if (error.code === "INVALID_SPECIALIZATION") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "specializationId",
            message: "Invalid or inactive specialization",
          },
        ],
      });
    }

    if (error.code === "INVALID_EXPERIENCE") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "experienceYears",
            message: error.message,
          },
        ],
      });
    }

    if (error.code === "INVALID_FEE") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "consultationFee",
            message: error.message,
          },
        ],
      });
    }

    // Generic server error
    console.error("Error updating doctor profile:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message:
            "An error occurred while updating profile. Please try again.",
        },
      ],
    });
  }
}

/**
 * Update doctor basic profile by ID
 * @route PATCH /api/doctors/:id/basic
 */
async function updateDoctorBasicProfileById(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Call service to update doctor basic profile
    const updatedDoctor = await doctorService.updateDoctorBasicProfileById(
      id,
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Doctor basic profile updated successfully",
      data: {
        doctor: updatedDoctor.toPublicJSON(),
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "DOCTOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "Doctor not found",
          },
        ],
      });
    }

    if (error.code === "INVALID_SPECIALIZATION") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "specializationId",
            message: "Invalid or inactive specialization",
          },
        ],
      });
    }

    // Generic server error
    console.error("Error updating doctor basic profile:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message:
            "An error occurred while updating basic profile. Please try again.",
        },
      ],
    });
  }
}

module.exports = {
  register,
  getAllDoctors,
  getDoctorById,
  getApprovedDoctors,
  updateDoctorStatus,
  updateMyProfile,
  updateDoctorBasicProfileById,
};
