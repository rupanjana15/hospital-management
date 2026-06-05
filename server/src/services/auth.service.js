/**
 * Unified Authentication Service
 * Handles authentication across all user types (patients, doctors, admins)
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const patientRepository = require("../repositories/patient.repository");
const doctorRepository = require("../repositories/doctor.repository");
const adminRepository = require("../repositories/admin.repository");
const auditLogRepository = require("../repositories/auditLog.repository");
const jwtConfig = require("../config/jwt.config");

class AuthService {
  /**
   * Unified login that works for patients, doctors, and admins
   * Automatically detects user role by searching across repositories
   * @param {Object} loginData - Login credentials
   * @param {string} loginData.email - User's email
   * @param {string} loginData.password - User's password (plain text)
   * @param {string} [loginData.ipAddress] - IP address of the request
   * @param {string} [loginData.userAgent] - User agent string
   * @returns {Promise<Object>} { token, user, role, expiresIn }
   * @throws {Error} If credentials are invalid or account is not accessible
   */
  async unifiedLogin(loginData) {
    const { email, password, ipAddress, userAgent } = loginData;

    // 1. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Search for user across all repositories
    let user = null;
    let role = null;
    let repository = null;

    // Check patients first
    user = patientRepository.findByEmail(normalizedEmail);
    if (user) {
      role = "PATIENT";
      repository = patientRepository;
    }

    // Check doctors if not found in patients
    if (!user) {
      user = doctorRepository.findByEmail(normalizedEmail);
      if (user) {
        role = "DOCTOR";
        repository = doctorRepository;
      }
    }

    // Check admins if not found in patients or doctors
    if (!user) {
      user = adminRepository.findByEmail(normalizedEmail);
      if (user) {
        role = "ADMIN";
        repository = adminRepository;
      }
    }

    // 3. If user not found in any repository, throw generic error
    if (!user) {
      // Log failed login attempt
      await auditLogRepository.create({
        action: "LOGIN_FAILED",
        performedBy: "UNKNOWN",
        performedByRole: "UNKNOWN",
        metadata: {
          email: normalizedEmail,
          reason: "Email not found in any repository",
        },
        ipAddress,
        userAgent,
      });

      const error = new Error("Invalid email or password");
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // 4. Role-specific status checks
    if (role === "PATIENT") {
      // Patients must have ACTIVE status
      if (user.status === "INACTIVE") {
        await auditLogRepository.create({
          action: "LOGIN_FAILED",
          performedBy: user.id,
          performedByRole: role,
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

      if (user.status === "DELETED") {
        await auditLogRepository.create({
          action: "LOGIN_FAILED",
          performedBy: user.id,
          performedByRole: role,
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
    } else if (role === "DOCTOR") {
      // Doctors must have APPROVED status to login
      if (user.status === "PENDING") {
        await auditLogRepository.create({
          action: "LOGIN_FAILED",
          performedBy: user.id,
          performedByRole: role,
          metadata: {
            email: normalizedEmail,
            reason: "Account pending approval",
          },
          ipAddress,
          userAgent,
        });

        const error = new Error(
          "Your account is awaiting admin approval. Please check back later."
        );
        error.code = "ACCOUNT_PENDING";
        throw error;
      }

      if (user.status === "REJECTED") {
        await auditLogRepository.create({
          action: "LOGIN_FAILED",
          performedBy: user.id,
          performedByRole: role,
          metadata: {
            email: normalizedEmail,
            reason: "Account rejected",
          },
          ipAddress,
          userAgent,
        });

        const error = new Error(
          "Your account was rejected. Please contact admin for more information."
        );
        error.code = "ACCOUNT_REJECTED";
        throw error;
      }

      if (user.status === "INACTIVE") {
        await auditLogRepository.create({
          action: "LOGIN_FAILED",
          performedBy: user.id,
          performedByRole: role,
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
    } else if (role === "ADMIN") {
      // Admins must have ACTIVE status
      if (user.status !== "ACTIVE") {
        await auditLogRepository.create({
          action: "LOGIN_FAILED",
          performedBy: user.id,
          performedByRole: role,
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
    }

    // 5. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Log failed login attempt for wrong password
      await auditLogRepository.create({
        action: "LOGIN_FAILED",
        performedBy: user.id,
        performedByRole: role,
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
    await repository.update(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    // 7. Generate JWT token with role
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: role,
    };

    const token = jwt.sign(tokenPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      algorithm: jwtConfig.algorithm,
    });

    // 8. Log successful login
    await auditLogRepository.create({
      action: "LOGIN",
      performedBy: user.id,
      performedByRole: role,
      metadata: {
        email: normalizedEmail,
      },
      ipAddress,
      userAgent,
    });

    // 9. Return token and user data with explicit role
    return {
      token,
      user,
      role,
      expiresIn: jwtConfig.expiresIn,
    };
  }

  /**
   * Get user by ID and role
   * Looks up user in the appropriate repository based on role
   * @param {string} userId - User ID
   * @param {string} role - User role (PATIENT, DOCTOR, ADMIN)
   * @returns {Object|null} User or null if not found
   */
  getUserByIdAndRole(userId, role) {
    switch (role) {
      case "PATIENT":
        return patientRepository.findById(userId);
      case "DOCTOR":
        return doctorRepository.findById(userId);
      case "ADMIN":
        return adminRepository.findById(userId);
      default:
        return null;
    }
  }

  /**
   * Check if user is active/approved based on their role
   * @param {Object} user - User object
   * @param {string} role - User role
   * @returns {boolean} True if user can access the system
   */
  isUserActive(user, role) {
    if (!user) return false;

    if (role === "PATIENT") {
      return user.status === "ACTIVE";
    } else if (role === "DOCTOR") {
      return user.status === "APPROVED";
    } else if (role === "ADMIN") {
      return user.status === "ACTIVE";
    }

    return false;
  }
}

module.exports = new AuthService();
