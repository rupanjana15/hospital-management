/**
 * Doctor Routes
 * Defines all routes for doctor-related operations
 */

const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor.controller");
const {
  validateDoctorRegistration,
  validateDoctorStatusUpdate,
  validateDoctorProfileUpdate,
  validateDoctorBasicProfileUpdateById,
  handleValidationErrors,
} = require("../middlewares/validation.middleware");
const {
  authenticateToken,
  requireRole,
} = require("../middlewares/auth.middleware");

/**
 * @route   POST /api/doctors/register
 * @desc    Register a new doctor (status: PENDING)
 * @access  Public
 */
router.post(
  "/register",
  validateDoctorRegistration,
  handleValidationErrors,
  doctorController.register
);

/**
 * @route   GET /api/doctors/approved
 * @desc    Get all approved doctors
 * @access  Public
 */
router.get("/approved", doctorController.getApprovedDoctors);

/**
 * @route   PATCH /api/doctors/:id/status
 * @desc    Update doctor status (PENDING -> APPROVED or REJECTED)
 * @access  Protected (Admin only)
 */
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole("ADMIN"),
  validateDoctorStatusUpdate,
  handleValidationErrors,
  doctorController.updateDoctorStatus
);

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors (all statuses)
 * @access  Protected (Admin only)
 */
router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  doctorController.getAllDoctors
);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get doctor by ID
 * @access  Protected (Doctor can view self, Admin can view all)
 */
router.get(
  "/:id",
  authenticateToken,
  requireRole("DOCTOR", "ADMIN", "PATIENT"),
  doctorController.getDoctorById
);

/**
 * @route   PATCH /api/doctors/:id/basic
 * @desc    Update doctor basic profile by ID (isChatOnline, qualification, specializationId only)
 * @access  Protected (Doctor can update self, Admin can update any)
 */
router.patch(
  "/:id/basic",
  authenticateToken,
  requireRole("DOCTOR", "ADMIN"),
  validateDoctorBasicProfileUpdateById,
  handleValidationErrors,
  doctorController.updateDoctorBasicProfileById
);

/**
 * @route   PUT /api/doctors/me
 * @desc    Update current doctor's profile
 * @access  Protected (Doctor only)
 */
router.put(
  "/me",
  authenticateToken,
  requireRole("DOCTOR"),
  validateDoctorProfileUpdate,
  handleValidationErrors,
  doctorController.updateMyProfile
);

module.exports = router;
