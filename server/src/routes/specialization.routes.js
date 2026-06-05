/**
 * Specialization Routes
 * Defines all routes for specialization-related operations
 */

const express = require("express");
const router = express.Router();
const specializationController = require("../controllers/specialization.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const {
  validateSpecializationCreate,
  validateSpecializationUpdate,
  handleValidationErrors,
} = require("../middlewares/validation.middleware");

/**
 * @route   GET /api/specializations
 * @desc    Get all specializations (active and inactive)
 * @access  Public
 */
router.get("/", specializationController.getAllSpecializations);

/**
 * @route   GET /api/specializations/active
 * @desc    Get all active specializations
 * @access  Public
 */
router.get("/active", specializationController.getActiveSpecializations);

/**
 * @route   GET /api/specializations/:id
 * @desc    Get specialization by ID
 * @access  Public
 */
router.get("/:id", specializationController.getSpecializationById);

/**
 * @route   POST /api/specializations
 * @desc    Create a new specialization
 * @access  ADMIN only
 */
router.post(
  "/",
  authenticateToken,
  validateSpecializationCreate,
  handleValidationErrors,
  specializationController.createSpecialization
);

/**
 * @route   PUT /api/specializations/:id
 * @desc    Update a specialization
 * @access  ADMIN only
 */
router.put(
  "/:id",
  authenticateToken,
  validateSpecializationUpdate,
  handleValidationErrors,
  specializationController.updateSpecialization
);

/**
 * @route   DELETE /api/specializations/:id
 * @desc    Delete a specialization (soft delete)
 * @access  ADMIN only
 */
router.delete(
  "/:id",
  authenticateToken,
  specializationController.deleteSpecialization
);

module.exports = router;
