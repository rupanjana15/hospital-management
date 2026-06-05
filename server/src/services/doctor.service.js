/**
 * Doctor Service
 * Business logic for doctor operations
 */

const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const doctorRepository = require("../repositories/doctor.repository");
const specializationRepository = require("../repositories/specialization.repository");
const { DoctorModel } = require("../models/doctor.model");

class DoctorService {
  /**
   * Register a new doctor
   * @param {Object} registrationData - Doctor registration data
   * @param {string} registrationData.fullName - Doctor's full name
   * @param {string} registrationData.email - Doctor's email
   * @param {string} registrationData.phone - Doctor's phone number
   * @param {string} registrationData.password - Doctor's password (plain text)
   * @param {string} registrationData.specializationId - Doctor's specialization ID
   * @param {string} registrationData.qualification - Doctor's qualification
   * @param {number} registrationData.experienceYears - Years of experience
   * @param {number} registrationData.consultationFee - Consultation fee
   * @returns {Promise<DoctorModel>} Registered doctor
   * @throws {Error} If validation fails or duplicate exists
   */
  async registerDoctor(registrationData) {
    const {
      fullName,
      email,
      phone,
      password,
      specializationId,
      qualification,
      experienceYears,
      consultationFee,
    } = registrationData;

    // 1. Normalize and trim inputs
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone.trim();
    const trimmedFullName = fullName.trim();
    const trimmedQualification = qualification.trim();

    // 2. Check for duplicate email
    const existingDoctorByEmail = doctorRepository.findByEmail(normalizedEmail);
    if (existingDoctorByEmail) {
      const error = new Error("Email already registered");
      error.code = "DUPLICATE_EMAIL";
      throw error;
    }

    // 3. Check for duplicate phone
    const existingDoctorByPhone = doctorRepository.findByPhone(trimmedPhone);
    if (existingDoctorByPhone) {
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

    // 5. Validate specialization exists and is active
    if (!specializationRepository.isValidAndActive(specializationId)) {
      const error = new Error("Invalid or inactive specialization");
      error.code = "INVALID_SPECIALIZATION";
      throw error;
    }

    // 6. Validate experienceYears (must be integer >= 0)
    const expYears = parseInt(experienceYears, 10);
    if (isNaN(expYears) || expYears < 0) {
      const error = new Error(
        "Experience years must be a non-negative integer"
      );
      error.code = "INVALID_EXPERIENCE";
      throw error;
    }

    // 7. Validate consultationFee (must be integer >= 0)
    const fee = parseInt(consultationFee, 10);
    if (isNaN(fee) || fee < 0) {
      const error = new Error(
        "Consultation fee must be a non-negative integer"
      );
      error.code = "INVALID_FEE";
      throw error;
    }

    // 8. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 9. Generate unique ID
    const id = uuidv4();

    // 10. Prepare doctor data
    const doctorData = {
      id,
      fullName: trimmedFullName,
      email: normalizedEmail,
      phone: trimmedPhone,
      passwordHash,
      specializationId,
      qualification: trimmedQualification,
      experienceYears: expYears,
      consultationFee: fee,
      status: "PENDING", // Doctor starts as PENDING, needs admin approval
      isChatOnline: false,
      availableSlots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    // 11. Create DoctorModel instance
    const doctor = new DoctorModel(doctorData);

    // 12. Validate model
    const validation = doctor.validate();
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(", "));
      error.code = "VALIDATION_ERROR";
      error.validationErrors = validation.errors;
      throw error;
    }

    // 13. Save to repository
    const createdDoctor = await doctorRepository.create(doctor);

    return createdDoctor;
  }

  /**
   * Get doctor by ID
   * @param {string} id - Doctor ID
   * @returns {DoctorModel|null} Doctor or null if not found
   */
  getDoctorById(id) {
    return doctorRepository.findById(id);
  }

  /**
   * Get doctor by email
   * @param {string} email - Doctor email
   * @returns {DoctorModel|null} Doctor or null if not found
   */
  getDoctorByEmail(email) {
    return doctorRepository.findByEmail(email);
  }

  /**
   * Get all doctors
   * @returns {DoctorModel[]} Array of all doctors
   */
  getAllDoctors() {
    return doctorRepository.getAll();
  }

  /**
   * Get all approved doctors
   * @returns {DoctorModel[]} Array of approved doctors
   */
  getAllApprovedDoctors() {
    return doctorRepository.getAllApproved();
  }

  /**
   * Get doctors by specialization
   * @param {string} specializationId - Specialization ID
   * @returns {DoctorModel[]} Array of doctors
   */
  getDoctorsBySpecialization(specializationId) {
    return doctorRepository.findBySpecialization(specializationId);
  }

  /**
   * Update doctor status (PENDING -> APPROVED or REJECTED)
   * @param {string} doctorId - Doctor ID
   * @param {string} newStatus - New status (APPROVED or REJECTED)
   * @param {string} adminId - Admin ID performing the action
   * @returns {Promise<DoctorModel>} Updated doctor
   * @throws {Error} If doctor not found or invalid status transition
   */
  async updateDoctorStatus(doctorId, newStatus, adminId) {
    // 1. Find doctor
    const doctor = doctorRepository.findById(doctorId);
    if (!doctor) {
      const error = new Error("Doctor not found");
      error.code = "DOCTOR_NOT_FOUND";
      throw error;
    }

    // // 2. Validate status transition (only PENDING -> APPROVED/REJECTED)
    // if (doctor.status !== "PENDING") {
    //   const error = new Error(
    //     `Cannot change status from ${doctor.status}. Only PENDING doctors can be approved or rejected.`
    //   );
    //   error.code = "INVALID_STATUS_TRANSITION";
    //   throw error;
    // }

    // 3. Validate new status
    const validStatuses = ["APPROVED", "REJECTED", "INACTIVE"];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error(
        "Invalid status. Must be APPROVED, REJECTED, or INACTIVE."
      );
      error.code = "INVALID_STATUS";
      throw error;
    }

    // 4. Update doctor status
    const updatedDoctor = await doctorRepository.update(doctorId, {
      status: newStatus,
    });

    return updatedDoctor;
  }

  /**
   * Update doctor profile
   * @param {string} doctorId - Doctor ID
   * @param {Object} updateData - Profile update data
   * @returns {Promise<DoctorModel>} Updated doctor
   * @throws {Error} If doctor not found or validation fails
   */
  async updateMyProfile(doctorId, updateData) {
    // 1. Find doctor
    const doctor = doctorRepository.findById(doctorId);
    if (!doctor) {
      const error = new Error("Doctor not found");
      error.code = "DOCTOR_NOT_FOUND";
      throw error;
    }

    // 2. Prepare update data (only allowed fields)
    const allowedFields = [
      "fullName",
      "phone",
      "specializationId",
      "qualification",
      "experienceYears",
      "consultationFee",
      "isChatOnline",
      "availableSlots",
    ];

    const sanitizedData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }

    // 3. Trim string fields
    if (sanitizedData.fullName) {
      sanitizedData.fullName = sanitizedData.fullName.trim();
    }
    if (sanitizedData.phone) {
      sanitizedData.phone = sanitizedData.phone.trim();
    }
    if (sanitizedData.qualification) {
      sanitizedData.qualification = sanitizedData.qualification.trim();
    }

    // 4. Check for duplicate phone if phone is being updated
    if (sanitizedData.phone) {
      const existingDoctorByPhone = doctorRepository.findByPhone(
        sanitizedData.phone
      );
      if (existingDoctorByPhone && existingDoctorByPhone.id !== doctorId) {
        const error = new Error("Phone number already registered");
        error.code = "DUPLICATE_PHONE";
        throw error;
      }
    }

    // 5. Validate specialization if being updated
    if (sanitizedData.specializationId) {
      if (
        !specializationRepository.isValidAndActive(
          sanitizedData.specializationId
        )
      ) {
        const error = new Error("Invalid or inactive specialization");
        error.code = "INVALID_SPECIALIZATION";
        throw error;
      }
    }

    // 6. Validate experience years if provided
    if (sanitizedData.experienceYears !== undefined) {
      const expYears = parseInt(sanitizedData.experienceYears, 10);
      if (isNaN(expYears) || expYears < 0) {
        const error = new Error(
          "Experience years must be a non-negative integer"
        );
        error.code = "INVALID_EXPERIENCE";
        throw error;
      }
      sanitizedData.experienceYears = expYears;
    }

    // 7. Validate consultation fee if provided
    if (sanitizedData.consultationFee !== undefined) {
      const fee = parseInt(sanitizedData.consultationFee, 10);
      if (isNaN(fee) || fee < 0) {
        const error = new Error(
          "Consultation fee must be a non-negative integer"
        );
        error.code = "INVALID_FEE";
        throw error;
      }
      sanitizedData.consultationFee = fee;
    }

    // 8. Update doctor
    const updatedDoctor = await doctorRepository.update(
      doctorId,
      sanitizedData
    );

    return updatedDoctor;
  }

  /**
   * Update doctor basic profile by ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} updateData - Basic profile update data
   * @returns {Promise<DoctorModel>} Updated doctor
   * @throws {Error} If doctor not found or validation fails
   */
  async updateDoctorBasicProfileById(doctorId, updateData) {
    // 1. Find doctor
    const doctor = doctorRepository.findById(doctorId);
    if (!doctor) {
      const error = new Error("Doctor not found");
      error.code = "DOCTOR_NOT_FOUND";
      throw error;
    }

    // 2. Prepare update data (only allowed fields for basic update)
    const allowedFields = ["isChatOnline", "qualification", "specializationId"];

    const sanitizedData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }

    // 3. Trim string fields
    if (sanitizedData.qualification) {
      sanitizedData.qualification = sanitizedData.qualification.trim();
    }

    // 4. Validate specialization if being updated
    if (sanitizedData.specializationId) {
      if (
        !specializationRepository.isValidAndActive(
          sanitizedData.specializationId
        )
      ) {
        const error = new Error("Invalid or inactive specialization");
        error.code = "INVALID_SPECIALIZATION";
        throw error;
      }
    }

    // 5. Update doctor
    const updatedDoctor = await doctorRepository.update(
      doctorId,
      sanitizedData
    );

    return updatedDoctor;
  }
}

module.exports = new DoctorService();
