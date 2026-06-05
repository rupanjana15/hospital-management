/**
 * Auth Controller
 * Handles HTTP requests for unified authentication
 */

const authService = require("../services/auth.service");

/**
 * Unified login for all user types (patients, doctors, admins)
 * Automatically detects user role and authenticates accordingly
 * @route POST /api/auth/login
 */
async function unifiedLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Get client IP address and user agent for audit logging
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Call unified auth service
    const result = await authService.unifiedLogin({
      email,
      password,
      ipAddress,
      userAgent,
    });

    // Clear any failed login attempts on successful login
    if (req.clearLoginAttempts) {
      req.clearLoginAttempts();
    }

    // Return success response with token and generic user data
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        user: result.user.toPublicJSON(),
        role: result.role,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    // Record failed login attempt for rate limiting
    if (req.recordFailedLoginAttempt) {
      req.recordFailedLoginAttempt();
    }

    // Handle specific error types
    if (error.code === "INVALID_CREDENTIALS") {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "credentials",
            message: "Invalid email or password",
          },
        ],
      });
    }

    if (error.code === "ACCOUNT_INACTIVE") {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "account",
            message: "Your account is inactive. Contact support.",
          },
        ],
      });
    }

    if (error.code === "ACCOUNT_DELETED") {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "account",
            message: "Your account has been deleted. Contact support.",
          },
        ],
      });
    }

    if (error.code === "ACCOUNT_PENDING") {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "account",
            message:
              "Your account is awaiting admin approval. Please check back later.",
          },
        ],
      });
    }

    if (error.code === "ACCOUNT_REJECTED") {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "account",
            message:
              "Your account was rejected. Please contact admin for more information.",
          },
        ],
      });
    }

    // Generic server error
    console.error("Error during unified login:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "general",
          message: "An error occurred during login. Please try again.",
        },
      ],
    });
  }
}

module.exports = {
  unifiedLogin,
};
