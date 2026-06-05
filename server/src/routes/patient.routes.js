/**
 * Patient Routes
 * Defines all routes for patient-related operations
 */

const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient.controller");
const {
  validatePatientRegistration,
  validatePatientLogin,
  validatePatientProfileUpdate,
  handleValidationErrors,
} = require("../middlewares/validation.middleware");
const {
  authenticateToken,
  requireRole,
} = require("../middlewares/auth.middleware");
const { loginRateLimiter } = require("../middlewares/rateLimit.middleware");

/**
 * @route   POST /api/patients/register
 * @desc    Register a new patient
 * @access  Public
 */
router.post(
  "/register",
  validatePatientRegistration,
  handleValidationErrors,
  patientController.register
);

/**
 * @route   POST /api/patients/login
 * @desc    Login a patient
 * @access  Public
 */
router.post(
  "/login",
  loginRateLimiter,
  validatePatientLogin,
  handleValidationErrors,
  patientController.login
);

/**
 * @route   GET /api/patients/me
 * @desc    Get current patient's profile
 * @access  Protected (PATIENT role only)
 */
router.get(
  "/me",
  authenticateToken,
  requireRole("PATIENT"),
  patientController.getMyProfile
);

/**
 * @route   GET /api/patients/me/upcoming-appointments/count
 * @desc    Get upcoming appointments count for current patient
 * @access  Protected (PATIENT role only)
 */
router.get(
  "/me/upcoming-appointments/count",
  authenticateToken,
  requireRole("PATIENT"),
  patientController.getUpcomingAppointmentsCount
);

/**
 * @route   PUT /api/patients/me
 * @desc    Update current patient's profile
 * @access  Protected (PATIENT role only)
 */
router.put(
  "/me",
  authenticateToken,
  requireRole("PATIENT"),
  validatePatientProfileUpdate,
  handleValidationErrors,
  patientController.updateMyProfile
);

/**
 * @route   GET /api/patients
 * @desc    Get all patients
 * @access  Protected (requires authentication)
 */
router.get("/", authenticateToken, patientController.getAllPatients);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Protected (requires authentication)
 */
router.get("/:id", authenticateToken, patientController.getPatientById);

module.exports = router;
