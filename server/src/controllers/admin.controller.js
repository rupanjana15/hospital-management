/**
 * Admin Controller
 * Handles HTTP requests for admin operations
 */

const patientService = require("../services/patient.service");
const doctorRepository = require("../repositories/doctor.repository");
const patientRepository = require("../repositories/patient.repository");
const appointmentRepository = require("../repositories/appointment.repository");

/**
 * Get all patients (admin view)
 * @route GET /api/admin/patients
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
    console.error("Error fetching patients for admin:", error);
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
 * Get patient by ID (admin view)
 * @route GET /api/admin/patients/:id
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
    console.error("Error fetching patient for admin:", error);
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
 * Toggle patient status (admin action)
 * @route PATCH /api/admin/patients/:id/status
 */
async function togglePatientStatus(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    // Get client IP address and user agent for audit logging
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Call service to toggle status
    const updatedPatient = await patientService.togglePatientStatus(
      id,
      adminId,
      ipAddress,
      userAgent
    );

    return res.status(200).json({
      success: true,
      message: `Patient status toggled to ${updatedPatient.status}`,
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
            field: "id",
            message: "Patient not found",
          },
        ],
      });
    }

    // Generic server error
    console.error("Error toggling patient status:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while toggling patient status",
        },
      ],
    });
  }
}

/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard/stats
 */
async function getDashboardStats(req, res) {
  try {
    // Get doctor statistics
    const allDoctors = doctorRepository.getAll();
    const approvedDoctors = allDoctors.filter((d) => d.status === "APPROVED");
    const pendingDoctors = allDoctors.filter((d) => d.status === "PENDING");

    // Get all patients with ACTIVE status
    const allPatients = patientRepository.getAll();
    const activePatients = allPatients.filter((p) => p.status === "ACTIVE");

    // Get appointment statistics
    const allAppointments = appointmentRepository.getAll();
    const confirmedAppointments = allAppointments.filter(
      (a) => a.status === "CONFIRMED"
    );

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    const todayAppointments = confirmedAppointments.filter(
      (a) => a.appointmentDate === today
    );

    return res.status(200).json({
      success: true,
      data: {
        doctors: {
          approved: approvedDoctors.length,
          pending: pendingDoctors.length,
        },
        totalPatients: activePatients.length,
        appointments: {
          total: allAppointments.length,
          today: todayAppointments.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred while fetching dashboard statistics",
        },
      ],
    });
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  togglePatientStatus,
  getDashboardStats,
};
