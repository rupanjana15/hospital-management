/**
 * Validation Middleware
 * Express validators for request validation and sanitization
 */

const { body, validationResult } = require("express-validator");
const { GENDER, BLOOD_GROUP } = require("../models/patient.model");

/**
 * Validation rules for patient registration
 */
const validatePatientRegistration = [
  // Full name validation
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3, max: 80 })
    .withMessage("Full name must be between 3 and 80 characters")
    .escape()
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Full name contains invalid characters"),

  // Email validation
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .toLowerCase(),

  // Phone validation
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9+]{10,15}$/)
    .withMessage("Phone number must be 10-15 digits (+ allowed)"),

  // Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one digit"),

  // Confirm password validation
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  // Optional: Gender validation
  body("gender")
    .optional()
    .isIn(Object.values(GENDER))
    .withMessage(`Gender must be one of: ${Object.values(GENDER).join(", ")}`),

  // Optional: Date of birth validation
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      const dob = new Date(value);
      if (dob > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),

  // Optional: Address validation
  body("address")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Address must not exceed 255 characters")
    .escape(),

  // Optional: Blood group validation
  body("bloodGroup")
    .optional()
    .isIn(Object.values(BLOOD_GROUP))
    .withMessage(
      `Blood group must be one of: ${Object.values(BLOOD_GROUP).join(", ")}`
    ),
];

/**
 * Validation rules for patient login
 */
const validatePatientLogin = [
  // Email validation
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .toLowerCase(),

  // Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

/**
 * Validation rules for doctor registration
 */
const validateDoctorRegistration = [
  // Full name validation (same as patient)
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3, max: 80 })
    .withMessage("Full name must be between 3 and 80 characters")
    .escape()
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Full name contains invalid characters"),

  // Email validation (same as patient)
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .toLowerCase(),

  // Phone validation (stricter for doctors - India format)
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+91\d{10}$/)
    .withMessage(
      "Phone number must be in format +91XXXXXXXXXX (Indian format)"
    ),

  // Password validation (same as patient)
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one digit"),

  // Confirm password validation
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  // Specialization ID validation
  body("specializationId")
    .trim()
    .notEmpty()
    .withMessage("Specialization is required"),

  // Qualification validation
  body("qualification")
    .trim()
    .notEmpty()
    .withMessage("Qualification is required")
    .isLength({ min: 3 })
    .withMessage("Qualification must be at least 3 characters")
    .escape(),

  // Experience years validation
  body("experienceYears")
    .notEmpty()
    .withMessage("Experience years is required")
    .isInt({ min: 0 })
    .withMessage("Experience years must be a non-negative integer"),

  // Consultation fee validation
  body("consultationFee")
    .notEmpty()
    .withMessage("Consultation fee is required")
    .isInt({ min: 0 })
    .withMessage("Consultation fee must be a non-negative integer"),
];

/**
 * Validation rules for doctor login (same as patient login)
 */
const validateDoctorLogin = [
  // Email validation
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .toLowerCase(),

  // Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

/**
 * Validation rules for unified login (email + password only)
 */
const validateLogin = [
  // Email validation
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .toLowerCase(),

  // Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

/**
 * Validation rules for patient profile update
 * All fields are optional, email and status changes are blocked
 */
const validatePatientProfileUpdate = [
  // Full name validation (optional)
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ min: 3, max: 80 })
    .withMessage("Full name must be between 3 and 80 characters")
    .escape()
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Full name contains invalid characters"),

  // Phone validation (optional)
  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .matches(/^[0-9+]{10,15}$/)
    .withMessage("Phone number must be 10-15 digits (+ allowed)"),

  // Gender validation (optional)
  body("gender")
    .optional()
    .custom((value) => {
      // Allow null or valid ENUM values
      if (value === null || value === "") return true;
      if (!Object.values(GENDER).includes(value)) {
        throw new Error(
          `Gender must be one of: ${Object.values(GENDER).join(", ")}`
        );
      }
      return true;
    }),

  // Date of birth validation (optional)
  body("dateOfBirth")
    .optional()
    .custom((value) => {
      // Allow null or empty string (will be converted to null)
      if (value === null || value === "") return true;

      // Validate ISO date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("Date of birth must be a valid date (YYYY-MM-DD)");
      }

      const dob = new Date(value);
      if (isNaN(dob.getTime())) {
        throw new Error("Date of birth must be a valid date");
      }

      if (dob > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),

  // Address validation (optional)
  body("address")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Address must not exceed 255 characters")
    .escape()
    .customSanitizer((value) => {
      // Convert empty string to null
      return value === "" ? null : value;
    }),

  // Blood group validation (optional)
  body("bloodGroup")
    .optional()
    .custom((value) => {
      // Allow null or valid ENUM values
      if (value === null || value === "") return true;
      if (!Object.values(BLOOD_GROUP).includes(value)) {
        throw new Error(
          `Blood group must be one of: ${Object.values(BLOOD_GROUP).join(", ")}`
        );
      }
      return true;
    }),

  // Email validation - reject if present
  body("email")
    .not()
    .exists()
    .withMessage(
      "Email cannot be changed. Please contact support if you need to update your email."
    ),

  // Status validation - reject if present
  body("status")
    .not()
    .exists()
    .withMessage("Status cannot be changed through profile update."),

  // Password validation - reject if present
  body("password")
    .not()
    .exists()
    .withMessage(
      "Password cannot be changed through profile update. Use change password endpoint."
    ),

  // Custom sanitization for empty strings to null
  body(["dateOfBirth", "gender"]).customSanitizer((value) => {
    return value === "" ? null : value;
  }),
];

/**
 * Middleware to handle validation results
 * Formats validation errors into standardized response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    }));

    return res.status(400).json({
      success: false,
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * Validation rules for doctor status update
 */
const validateDoctorStatusUpdate = [
  // Status validation
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["APPROVED", "REJECTED", "INACTIVE"])
    .withMessage("Status must be either APPROVED, REJECTED, or INACTIVE"),
];

/**
 * Validation rules for doctor profile update
 * All fields are optional, id, email, status, password changes are blocked
 */
const validateDoctorProfileUpdate = [
  // Full name validation (optional)
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ min: 3, max: 80 })
    .withMessage("Full name must be between 3 and 80 characters")
    .escape()
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Full name contains invalid characters"),

  // Phone validation (optional)
  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .matches(/^\+91\d{10}$/)
    .withMessage(
      "Phone number must be in format +91XXXXXXXXXX (Indian format)"
    ),

  // Specialization ID validation (optional)
  body("specializationId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Specialization cannot be empty"),

  // Qualification validation (optional)
  body("qualification")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Qualification cannot be empty")
    .isLength({ min: 3 })
    .withMessage("Qualification must be at least 3 characters")
    .escape(),

  // Experience years validation (optional)
  body("experienceYears")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Experience years must be a non-negative integer"),

  // Consultation fee validation (optional)
  body("consultationFee")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Consultation fee must be a non-negative integer"),

  // Is chat online validation (optional)
  body("isChatOnline")
    .optional()
    .isBoolean()
    .withMessage("isChatOnline must be a boolean value"),

  // Available slots validation (optional)
  body("availableSlots")
    .optional()
    .isArray()
    .withMessage("Available slots must be an array")
    .custom((slots) => {
      if (!Array.isArray(slots)) return true; // Let isArray handle this

      slots.forEach((slot, index) => {
        // Day of week validation (0-6)
        if (
          slot.dayOfWeek === undefined ||
          slot.dayOfWeek < 0 ||
          slot.dayOfWeek > 6
        ) {
          throw new Error(
            `Slot ${
              index + 1
            }: dayOfWeek must be between 0 (Sunday) and 6 (Saturday)`
          );
        }

        // Time format validation (HH:mm)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!slot.startTime || !timeRegex.test(slot.startTime)) {
          throw new Error(
            `Slot ${index + 1}: startTime must be in HH:mm format (24-hour)`
          );
        }
        if (!slot.endTime || !timeRegex.test(slot.endTime)) {
          throw new Error(
            `Slot ${index + 1}: endTime must be in HH:mm format (24-hour)`
          );
        }

        // Start time must be before end time
        if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
          throw new Error(
            `Slot ${index + 1}: startTime must be before endTime`
          );
        }

        // Slot duration validation
        if (
          !slot.slotDurationMinutes ||
          slot.slotDurationMinutes <= 0 ||
          !Number.isInteger(slot.slotDurationMinutes)
        ) {
          throw new Error(
            `Slot ${index + 1}: slotDurationMinutes must be a positive integer`
          );
        }
      });
      return true;
    }),

  // ID validation - reject if present
  body("id").not().exists().withMessage("ID cannot be changed."),

  // Email validation - reject if present
  body("email")
    .not()
    .exists()
    .withMessage(
      "Email cannot be changed. Please contact support if you need to update your email."
    ),

  // Status validation - reject if present
  body("status")
    .not()
    .exists()
    .withMessage("Status cannot be changed through profile update."),

  // Password validation - reject if present
  body("password")
    .not()
    .exists()
    .withMessage(
      "Password cannot be changed through profile update. Use change password endpoint."
    ),

  // Password hash validation - reject if present
  body("passwordHash")
    .not()
    .exists()
    .withMessage("Password hash cannot be changed."),

  // Created at validation - reject if present
  body("createdAt")
    .not()
    .exists()
    .withMessage("Created date cannot be changed."),

  // Updated at validation - reject if present
  body("updatedAt")
    .not()
    .exists()
    .withMessage("Updated date cannot be changed."),

  // Last login at validation - reject if present
  body("lastLoginAt")
    .not()
    .exists()
    .withMessage("Last login date cannot be changed."),
];

/**
 * Validation rules for doctor basic profile update by ID
 * Only allows updating: isChatOnline, qualification, specializationId
 */
const validateDoctorBasicProfileUpdateById = [
  // Is chat online validation (optional)
  body("isChatOnline")
    .optional()
    .isBoolean()
    .withMessage("isChatOnline must be a boolean value"),

  // Qualification validation (optional)
  body("qualification")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Qualification cannot be empty")
    .isLength({ min: 3 })
    .withMessage("Qualification must be at least 3 characters")
    .escape(),

  // Specialization ID validation (optional)
  body("specializationId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Specialization cannot be empty"),

  // Block all other fields
  body("fullName")
    .not()
    .exists()
    .withMessage("Full name cannot be updated through this endpoint."),

  body("phone")
    .not()
    .exists()
    .withMessage("Phone cannot be updated through this endpoint."),

  body("experienceYears")
    .not()
    .exists()
    .withMessage("Experience years cannot be updated through this endpoint."),

  body("consultationFee")
    .not()
    .exists()
    .withMessage("Consultation fee cannot be updated through this endpoint."),

  body("availableSlots")
    .not()
    .exists()
    .withMessage("Available slots cannot be updated through this endpoint."),

  // Block sensitive fields
  body("id").not().exists().withMessage("ID cannot be changed."),

  body("email")
    .not()
    .exists()
    .withMessage(
      "Email cannot be changed. Please contact support if you need to update your email."
    ),

  body("status")
    .not()
    .exists()
    .withMessage("Status cannot be changed through profile update."),

  body("password")
    .not()
    .exists()
    .withMessage(
      "Password cannot be changed through profile update. Use change password endpoint."
    ),

  body("passwordHash")
    .not()
    .exists()
    .withMessage("Password hash cannot be changed."),

  body("createdAt")
    .not()
    .exists()
    .withMessage("Created date cannot be changed."),

  body("updatedAt")
    .not()
    .exists()
    .withMessage("Updated date cannot be changed."),

  body("lastLoginAt")
    .not()
    .exists()
    .withMessage("Last login date cannot be changed."),
];

/**
 * Validation rules for creating a specialization
 */
const validateSpecializationCreate = [
  // Name validation
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Specialization name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Specialization name must be between 2 and 100 characters")
    .escape(),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters")
    .escape(),
];

/**
 * Validation rules for updating a specialization
 */
const validateSpecializationUpdate = [
  // ID validation (optional, for ID updates)
  body("id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Specialization ID cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Specialization ID must be between 2 and 50 characters")
    .escape(),

  // Name validation (optional)
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Specialization name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Specialization name must be between 2 and 100 characters")
    .escape(),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters")
    .escape(),

  // isActive validation (optional)
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

module.exports = {
  validatePatientRegistration,
  validatePatientLogin,
  validateDoctorRegistration,
  validateDoctorLogin,
  validateLogin,
  validatePatientProfileUpdate,
  validateDoctorStatusUpdate,
  validateDoctorProfileUpdate,
  validateDoctorBasicProfileUpdateById,
  validateSpecializationCreate,
  validateSpecializationUpdate,
  handleValidationErrors,
};
