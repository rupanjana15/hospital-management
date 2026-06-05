/**
 * Auth Routes
 * Unified authentication routes for all user types
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  validateLogin,
  handleValidationErrors,
} = require("../middlewares/validation.middleware");
const { loginRateLimiter } = require("../middlewares/rateLimit.middleware");

/**
 * @route   POST /api/auth/login
 * @desc    Unified login for patients, doctors, and admins
 * @access  Public
 */
router.post(
  "/login",
  loginRateLimiter,
  validateLogin,
  handleValidationErrors,
  authController.unifiedLogin
);

module.exports = router;
