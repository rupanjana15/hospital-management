/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes with role-based access control
 */

const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt.config");
const authService = require("../services/auth.service");

/**
 * Middleware to verify JWT token and authenticate requests
 * Extracts token from Authorization header, verifies it, and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Access token is required",
          },
        ],
      });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      algorithms: [jwtConfig.algorithm],
    });

    // Extract role from token
    const role = decoded.role;

    // Validate that the user still exists in the appropriate repository
    const user = authService.getUserByIdAndRole(decoded.userId, role);

    if (!user) {
      return res.status(401).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Invalid token: User not found",
          },
        ],
      });
    }

    // Check if user is active/approved based on their role
    if (!authService.isUserActive(user, role)) {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Your account is not active. Contact support.",
          },
        ],
      });
    }

    // Attach user information to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userObject: user, // Full user object for convenience
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Token has expired. Please login again.",
          },
        ],
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Invalid token",
          },
        ],
      });
    }

    // Generic error
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          field: "authorization",
          message: "Authentication failed",
        },
      ],
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if token is missing
 * Useful for endpoints that have different behavior for authenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function optionalAuthentication(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      algorithms: [jwtConfig.algorithm],
    });

    // Extract role and validate user
    const role = decoded.role;
    const user = authService.getUserByIdAndRole(decoded.userId, role);

    if (user && authService.isUserActive(user, role)) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        userObject: user,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without authentication
    next();
  }
}

/**
 * Role-based authorization middleware factory
 * Creates middleware that restricts access to specific roles
 * @param {...string} allowedRoles - One or more roles that are allowed access
 * @returns {Function} Express middleware function
 * @example
 * router.get('/admin-only', authenticateToken, requireRole('ADMIN'), handler);
 * router.get('/doctors-and-admins', authenticateToken, requireRole('DOCTOR', 'ADMIN'), handler);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Authentication required",
          },
        ],
      });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Access denied: Insufficient permissions",
          },
        ],
      });
    }

    next();
  };
}

/**
 * Convenience middleware to allow any authenticated user (any role)
 * Useful for endpoints that just need authentication, not specific roles
 */
function requireAnyRole() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: [
          {
            field: "authorization",
            message: "Authentication required",
          },
        ],
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuthentication,
  requireRole,
  requireAnyRole,
};
