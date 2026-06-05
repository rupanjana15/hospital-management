/**
 * JWT Configuration
 * Configuration settings for JSON Web Tokens
 */

require("dotenv").config();

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  issuer: "hospital-management-system",
  algorithm: "HS256",
};

// Validate that JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error(
    "❌ FATAL ERROR: JWT_SECRET is not defined in environment variables."
  );
  console.error("Please create a .env file with JWT_SECRET defined.");
  console.error(
    "You can generate a secure secret using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
  process.exit(1);
}

// Validate JWT_SECRET length (minimum 32 characters for security)
if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security."
  );
}
