/**
 * Admin Routes
 * Defines all routes for admin-related operations
 */

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const {
  authenticateToken,
  requireRole,
} = require("../middlewares/auth.middleware");

/**
 * @route   GET /api/admin/patients
 * @desc    Get all patients (admin only)
 * @access  Protected (ADMIN role only)
 */
router.get(
  "/patients",
  authenticateToken,
  requireRole("ADMIN"),
  adminController.getAllPatients
);

/**
 * @route   GET /api/admin/patients/:id
 * @desc    Get patient by ID (admin only)
 * @access  Protected (ADMIN role only)
 */
router.get(
  "/patients/:id",
  authenticateToken,
  requireRole("ADMIN"),
  adminController.getPatientById
);

/**
 * @route   PATCH /api/admin/patients/:id/status
 * @desc    Toggle patient status (admin only)
 * @access  Protected (ADMIN role only)
 */
router.patch(
  "/patients/:id/status",
  authenticateToken,
  requireRole("ADMIN"),
  adminController.togglePatientStatus
);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics (total active doctors, patients, and confirmed appointments)
 * @access  Protected (ADMIN role only)
 */
router.get("/dashboard/stats", adminController.getDashboardStats);

module.exports = router;
