/**
 * Rate Limiting Middleware
 * Prevents brute force attacks by limiting login attempts per IP address
 */

/**
 * In-memory store for tracking failed login attempts
 * Structure: Map<IP_ADDRESS, { attempts: number, resetAt: Date }>
 */
const loginAttempts = new Map();

/**
 * Configuration
 */
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5, // Maximum failed attempts allowed
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
};

/**
 * Clean up expired entries periodically (every 5 minutes)
 * Prevents memory leaks from abandoned IP addresses
 */
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.resetAt < now) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);
// Don't keep the Node process alive just for this housekeeping timer
cleanupTimer.unref();

/**
 * Rate limiting middleware for login attempts
 * Tracks failed login attempts by IP address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function loginRateLimiter(req, res, next) {
  // Get client IP address (handle proxies)
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    req.ip;

  const now = Date.now();
  const attemptData = loginAttempts.get(ip);

  // Check if IP has attempt data
  if (attemptData) {
    // Check if the window has expired
    if (attemptData.resetAt < now) {
      // Reset the counter
      loginAttempts.delete(ip);
    } else if (attemptData.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
      // Rate limit exceeded
      const retryAfterSeconds = Math.ceil((attemptData.resetAt - now) / 1000);

      return res.status(429).json({
        success: false,
        errors: [
          {
            field: "general",
            message: `Too many login attempts. Please try again after ${Math.ceil(
              retryAfterSeconds / 60
            )} minutes.`,
          },
        ],
        retryAfter: retryAfterSeconds,
      });
    }
  }

  // Attach helper function to track failed attempt
  req.recordFailedLoginAttempt = () => {
    const existingData = loginAttempts.get(ip);

    if (existingData && existingData.resetAt > now) {
      // Increment existing counter
      existingData.attempts += 1;
    } else {
      // Create new counter
      loginAttempts.set(ip, {
        attempts: 1,
        resetAt: now + RATE_LIMIT_CONFIG.windowMs,
      });
    }
  };

  // Attach helper function to clear attempts on successful login
  req.clearLoginAttempts = () => {
    loginAttempts.delete(ip);
  };

  next();
}

/**
 * Get current rate limit status for an IP (useful for debugging)
 * @param {string} ip - IP address
 * @returns {Object|null} Rate limit status or null
 */
function getRateLimitStatus(ip) {
  const data = loginAttempts.get(ip);
  if (!data) return null;

  const now = Date.now();
  if (data.resetAt < now) {
    loginAttempts.delete(ip);
    return null;
  }

  return {
    attempts: data.attempts,
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - data.attempts),
    resetAt: new Date(data.resetAt).toISOString(),
  };
}

module.exports = {
  loginRateLimiter,
  getRateLimitStatus,
  RATE_LIMIT_CONFIG,
};
