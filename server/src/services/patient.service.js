/**
 * Patient Service
 * Business logic for patient operations
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const patientRepository = require("../repositories/patient.repository");
const auditLogRepository = require("../repositories/auditLog.repository");
const { PatientModel, GENDER } = require("../models/patient.model");
const jwtConfig = require("../config/jwt.config");

class PatientService {
  /**
   * Register a new patient
   * @param {Object} registrationData - Patient registration data
   * @param {string} registrationData.fullName - Patient's full name
   * @param {string} registrationData.email - Patient's email
   * @param {string} registrationData.phone - Patient's phone number
   * @param {string} registrationData.password - Patient's password (plain text)
   * @param {string} [registrationData.dateOfBirth] - Patient's date of birth
   * @param {string} [registrationData.gender] - Patient's gender
   * @param {string} [registrationData.address] - Patient's address
   * @returns {Promise<PatientModel>} Registered patient
   * @throws {Error} If validation fails or duplicate exists
   */
  async registerPatient(registrationData) {
    const { fullName, email, phone, password, dateOfBirth, gender, address } =
      registrationData;

    // 1. Normalize and trim inputs
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone.trim();
    const trimmedFullName = fullName.trim();

    // 2. Check for duplicate email
    const existingPatientByEmail =
      patientRepository.findByEmail(normalizedEmail);
    if (existingPatientByEmail) {
      const error = new Error("Email already registered");
      error.code = "DUPLICATE_EMAIL";
      throw error;
    }

    // 3. Check for duplicate phone
    const existingPatientByPhone = patientRepository.findByPhone(trimmedPhone);
    if (existingPatientByPhone) {
      const error = new Error("Phone number already registered");
      error.code = "DUPLICATE_PHONE";
      throw error;
    }

    // 4. Validate password strength (min 8 chars, at least 1 letter and 1 digit)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      const error = new Error(
        "Password must be at least 8 characters and contain at least one letter and one digit"
      );
      error.code = "INVALID_PASSWORD";
      throw error;
    }

    // 5. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 6. Generate unique ID
    const id = uuidv4();

    // 7. Prepare patient data
    const patientData = {
      id,
      fullName: trimmedFullName,
      email: normalizedEmail,
      phone: trimmedPhone,
      passwordHash,
      dateOfBirth: dateOfBirth || null,
      gender: gender || GENDER.NOT_SPECIFIED,
      address: address ? address.trim() : "",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    // 8. Create PatientModel instance
    const patient = new PatientModel(patientData);

    // 9. Validate model
    const validation = patient.validate();
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(", "));
      error.code = "VALIDATION_ERROR";
      error.validationErrors = validation.errors;
      throw error;
    }

    // 10. Save to repository
    const createdPatient = await patientRepository.create(patient);

    return createdPatient;
  }

  /**
   * Get patient by ID
   * @param {string} id - Patient ID
   * @returns {PatientModel|null} Patient or null if not found
   */
  getPatientById(id) {
    return patientRepository.findById(id);
  }

  /**
   * Get patient by email
   * @param {string} email - Patient email
   * @returns {PatientModel|null} Patient or null if not found
   */
  getPatientByEmail(email) {
    return patientRepository.findByEmail(email);
  }

  /**
   * Get all patients
   * @returns {PatientModel[]} Array of all patients
   */
  getAllPatients() {
    return patientRepository.getAll();
  }

  /**
   * Login a patient
   * @param {Object} loginData - Login credentials
   * @param {string} loginData.email - Patient's email
   * @param {string} loginData.password - Patient's password (plain text)
   * @param {string} [loginData.ipAddress] - IP address of the request
   * @param {string} [loginData.userAgent] - User agent string
   * @returns {Promise<Object>} { token, patient, expiresIn }
   * @throws {Error} If credentials are invalid or account is inactive
   */
  async loginPatient(loginData) {
    const { email, password, ipAddress, userAgent } = loginData;

    // 1. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find patient by email
    const patient = patientRepository.findByEmail(normalizedEmail);

    // 3. If patient not found, throw generic error (don't reveal if email exists)
    if (!patient) {
      // Log failed login attempt
      await auditLogRepository.create({
        action: "LOGIN_FAILED",
        performedBy: "UNKNOWN",
        performedByRole: "PATIENT",
        metadata: {
          email: normalizedEmail,
          reason: "Email not found",
        },
        ipAddress,
        userAgent,
      });

      const error = new Error("Invalid email or password");
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // 4. Check account status
    if (patient.status === "INACTIVE") {
      // Log failed login attempt for inactive account
      await auditLogRepository.create({
        action: "LOGIN_FAILED",
        performedBy: patient.id,
        performedByRole: "PATIENT",
        metadata: {
          email: normalizedEmail,
          reason: "Account inactive",
        },
        ipAddress,
        userAgent,
      });

      const error = new Error("Your account is inactive. Contact support.");
      error.code = "ACCOUNT_INACTIVE";
      throw error;
    }

    if (patient.status === "DELETED") {
      // Log failed login attempt for deleted account
      await auditLogRepository.create({
        action: "LOGIN_FAILED",
        performedBy: patient.id,
        performedByRole: "PATIENT",
        metadata: {
          email: normalizedEmail,
          reason: "Account deleted",
        },
        ipAddress,
        userAgent,
      });

      const error = new Error(
        "Your account has been deleted. Contact support."
      );
      error.code = "ACCOUNT_DELETED";
      throw error;
    }

    // 5. Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      patient.passwordHash
    );

    if (!isPasswordValid) {
      // Log failed login attempt for wrong password
      await auditLogRepository.create({
        action: "LOGIN_FAILED",
        performedBy: patient.id,
        performedByRole: "PATIENT",
        metadata: {
          email: normalizedEmail,
          reason: "Invalid password",
        },
        ipAddress,
        userAgent,
      });

      const error = new Error("Invalid email or password");
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // 6. Update lastLoginAt timestamp
    await patientRepository.update(patient.id, {
      lastLoginAt: new Date().toISOString(),
    });

    // 7. Generate JWT token
    const tokenPayload = {
      userId: patient.id,
      email: patient.email,
      role: "PATIENT",
    };

    const token = jwt.sign(tokenPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      algorithm: jwtConfig.algorithm,
    });

    // 8. Log successful login
    await auditLogRepository.create({
      action: "LOGIN",
      performedBy: patient.id,
      performedByRole: "PATIENT",
      metadata: {
        email: normalizedEmail,
      },
      ipAddress,
      userAgent,
    });

    // 9. Return token and patient data
    return {
      token,
      patient,
      expiresIn: jwtConfig.expiresIn,
    };
  }

  /**
   * Update patient profile
   * @param {string} userId - Patient ID from JWT token
   * @param {Object} updateData - Profile update data
   * @param {string} [updateData.fullName] - Updated full name
   * @param {string} [updateData.phone] - Updated phone number
   * @param {string} [updateData.dateOfBirth] - Updated date of birth
   * @param {string} [updateData.gender] - Updated gender
   * @param {string} [updateData.address] - Updated address
   * @param {string} [updateData.bloodGroup] - Updated blood group
   * @param {string} [updateData.ipAddress] - IP address for audit logging
   * @param {string} [updateData.userAgent] - User agent for audit logging
   * @returns {Promise<PatientModel>} Updated patient
   * @throws {Error} If validation fails or duplicate phone exists
   */
  async updateMyProfile(userId, updateData) {
    const {
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      ipAddress,
      userAgent,
    } = updateData;

    // 1. Find existing patient
    const existingPatient = patientRepository.findById(userId);
    if (!existingPatient) {
      const error = new Error("Patient not found");
      error.code = "PATIENT_NOT_FOUND";
      throw error;
    }

    // 2. Prepare updates object (only include provided fields)
    const updates = {};
    const changedFields = [];

    // 3. Validate and add each field if provided
    if (fullName !== undefined) {
      const trimmedFullName = fullName.trim();
      if (trimmedFullName !== existingPatient.fullName) {
        updates.fullName = trimmedFullName;
        changedFields.push({
          field: "fullName",
          oldValue: existingPatient.fullName,
          newValue: trimmedFullName,
        });
      }
    }

    if (phone !== undefined) {
      const trimmedPhone = phone.trim();

      // Check for duplicate phone (exclude current user)
      const existingPatientByPhone =
        patientRepository.findByPhone(trimmedPhone);
      if (existingPatientByPhone && existingPatientByPhone.id !== userId) {
        const error = new Error(
          "Phone number already registered to another account"
        );
        error.code = "DUPLICATE_PHONE";
        throw error;
      }

      if (trimmedPhone !== existingPatient.phone) {
        updates.phone = trimmedPhone;
        changedFields.push({
          field: "phone",
          oldValue: existingPatient.phone,
          newValue: trimmedPhone,
        });
      }
    }

    if (dateOfBirth !== undefined) {
      // Convert empty string to null
      const normalizedDob = dateOfBirth === "" ? null : dateOfBirth;
      if (normalizedDob !== existingPatient.dateOfBirth) {
        updates.dateOfBirth = normalizedDob;
        changedFields.push({
          field: "dateOfBirth",
          oldValue: existingPatient.dateOfBirth,
          newValue: normalizedDob,
        });
      }
    }

    if (gender !== undefined) {
      // Convert empty string to null
      const normalizedGender = gender === "" ? null : gender;
      if (normalizedGender !== existingPatient.gender) {
        updates.gender = normalizedGender;
        changedFields.push({
          field: "gender",
          oldValue: existingPatient.gender,
          newValue: normalizedGender,
        });
      }
    }

    if (address !== undefined) {
      // Convert empty string to null
      const normalizedAddress =
        address === "" ? null : address ? address.trim() : null;
      if (normalizedAddress !== existingPatient.address) {
        updates.address = normalizedAddress;
        changedFields.push({
          field: "address",
          oldValue: existingPatient.address,
          newValue: normalizedAddress,
        });
      }
    }

    if (bloodGroup !== undefined) {
      // Convert empty string to null
      const normalizedBloodGroup = bloodGroup === "" ? null : bloodGroup;
      if (normalizedBloodGroup !== existingPatient.bloodGroup) {
        updates.bloodGroup = normalizedBloodGroup;
        changedFields.push({
          field: "bloodGroup",
          oldValue: existingPatient.bloodGroup,
          newValue: normalizedBloodGroup,
        });
      }
    }

    // 4. If no changes, return existing patient
    if (Object.keys(updates).length === 0) {
      return existingPatient;
    }

    // 5. Update in repository
    const updatedPatient = await patientRepository.update(userId, updates);

    // 6. Log profile update to audit log
    await auditLogRepository.create({
      action: "PROFILE_UPDATE",
      performedBy: userId,
      performedByRole: "PATIENT",
      metadata: {
        changedFields: changedFields,
      },
      ipAddress,
      userAgent,
    });

    return updatedPatient;
  }

  /**
   * Toggle patient status between ACTIVE and INACTIVE
   * @param {string} patientId - Patient ID
   * @param {string} adminId - Admin ID performing the action
   * @param {string} [ipAddress] - IP address for audit logging
   * @param {string} [userAgent] - User agent for audit logging
   * @returns {Promise<PatientModel>} Updated patient
   * @throws {Error} If patient not found
   */
  async togglePatientStatus(patientId, adminId, ipAddress, userAgent) {
    // 1. Find existing patient
    const patient = patientRepository.findById(patientId);
    if (!patient) {
      const error = new Error("Patient not found");
      error.code = "PATIENT_NOT_FOUND";
      throw error;
    }

    // 2. Determine new status (toggle between ACTIVE and INACTIVE)
    const currentStatus = patient.status;
    let newStatus;
    if (currentStatus === "ACTIVE") {
      newStatus = "INACTIVE";
    } else if (currentStatus === "INACTIVE") {
      newStatus = "ACTIVE";
    } else {
      // If DELETED or other, don't change
      return patient;
    }

    // 3. Update status
    const updatedPatient = await patientRepository.update(patientId, {
      status: newStatus,
    });

    // 4. Log status change to audit log
    await auditLogRepository.create({
      action: "PATIENT_STATUS_TOGGLE",
      performedBy: adminId,
      performedByRole: "ADMIN",
      metadata: {
        patientId: patientId,
        oldStatus: currentStatus,
        newStatus: newStatus,
      },
      ipAddress,
      userAgent,
    });

    return updatedPatient;
  }
}

module.exports = new PatientService();
