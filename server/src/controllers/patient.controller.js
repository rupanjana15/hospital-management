/**
 * Patient Controller
 * Handles HTTP requests for patient operations
 */

const patientService = require("../services/patient.service");
const appointmentRepository = require("../repositories/appointment.repository");

/**
 * Register a new patient
 * @route POST /api/patients/register
 */
async function register(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
    } = req.body;

    // Call service to register patient
    const patient = await patientService.registerPatient({
      fullName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
    });

    // Return success response with sanitized patient data
    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      data: {
        patient: patient.toPublicJSON(),
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
    console.error("Error during patient registration:", error);
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
 * Get all patients
 * @route GET /api/patients
 */
async function getAllPatients(req, res) {
  try {
    const patients = patientService.getAllPatients();
    const publicPatients = patients.map((p) => p.toPublicJSON());

    return res.status(200).json({
      success: true,
      data: {
        patients: publicPatients,
        count: publicPatients.length,
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching patients",
        },
      ],
    });
  }
}

/**
 * Get patient by ID
 * @route GET /api/patients/:id
 */
async function getPatientById(req, res) {
  try {
    const { id } = req.params;
    const patient = patientService.getPatientById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "id",
            message: "Patient not found",
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        patient: patient.toPublicJSON(),
      },
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching patient",
        },
      ],
    });
  }
}

/**
 * Login a patient (Backward compatible - use /api/auth/login for unified login)
 * @route POST /api/patients/login
 * @deprecated Use POST /api/auth/login instead for unified authentication
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Get client IP address and user agent for audit logging
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Call service to login patient
    const result = await patientService.loginPatient({
      email,
      password,
      ipAddress,
      userAgent,
    });

    // Clear any failed login attempts on successful login
    if (req.clearLoginAttempts) {
      req.clearLoginAttempts();
    }

    // Return success response with token and sanitized patient data
    // Keep original response format for backward compatibility
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        patient: result.patient.toPublicJSON(),
        expiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    // Record failed login attempt for rate limiting
    if (req.recordFailedLoginAttempt) {
      req.recordFailedLoginAttempt();
    }

    // Handle specific error types
    if (error.code === "INVALID_CREDENTIALS") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "credentials",
            message: "Invalid email or password",
          },
        ],
      });
    }

    if (error.code === "ACCOUNT_INACTIVE") {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "account",
            message: "Your account is inactive. Contact support.",
          },
        ],
      });
    }

    if (error.code === "ACCOUNT_DELETED") {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "account",
            message: "Your account has been deleted. Contact support.",
          },
        ],
      });
    }

    // Generic server error
    console.error("Error during patient login:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred during login. Please try again.",
        },
      ],
    });
  }
}

/**
 * Get current patient's profile
 * @route GET /api/patients/me
 */
async function getMyProfile(req, res) {
  try {
    // req.user is populated by authenticateToken middleware
    const userId = req.user.userId;

    const patient = patientService.getPatientById(userId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "patient",
            message: "Patient not found",
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        patient: patient.toPublicJSON(),
      },
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching your profile",
        },
      ],
    });
  }
}

/**
 * Update current patient's profile
 * @route PUT /api/patients/me
 */
async function updateMyProfile(req, res) {
  try {
    // req.user is populated by authenticateToken middleware
    const userId = req.user.userId;

    const { fullName, phone, dateOfBirth, gender, address, bloodGroup } =
      req.body;

    // Get client IP address and user agent for audit logging
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Call service to update patient profile
    const updatedPatient = await patientService.updateMyProfile(userId, {
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        patient: updatedPatient.toPublicJSON(),
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error.code === "PATIENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        errors: [
          {
            field: "patient",
            message: "Patient not found",
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
            message: "Phone number already registered to another account",
          },
        ],
      });
    }

    // Generic server error
    console.error("Error updating patient profile:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message:
            "An error occurred while updating your profile. Please try again.",
        },
      ],
    });
  }
}

/**
 * Get upcoming appointments count for current patient
 * @route GET /api/patients/me/upcoming-appointments/count
 */
async function getUpcomingAppointmentsCount(req, res) {
  try {
    // req.user is populated by authenticateToken middleware
    const patientId = req.user.userId;

    // Get current date and time
    const now = new Date();

    // Get all appointments for the patient
    const allAppointments = appointmentRepository.findByPatientId(patientId);

    // Filter for upcoming CONFIRMED appointments (future date or today but future time)
    const upcomingAppointments = allAppointments.filter((appointment) => {
      if (appointment.status !== "CONFIRMED") {
        return false;
      }

      // Create a datetime object for the appointment
      const appointmentDateTime = new Date(
        `${appointment.appointmentDate}T${appointment.startTime}`
      );

      // Return true only if the appointment is in the future
      return appointmentDateTime > now;
    });

    return res.status(200).json({
      success: true,
      data: {
        count: upcomingAppointments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments count:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message:
            "An error occurred while fetching upcoming appointments count",
        },
      ],
    });
  }
}

module.exports = {
  register,
  getAllPatients,
  getPatientById,
  login,
  getMyProfile,
  updateMyProfile,
  getUpcomingAppointmentsCount,
};
