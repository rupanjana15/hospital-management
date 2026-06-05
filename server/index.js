/**
 * Hospital Management System - Backend Server
 * Main entry point for the Express application
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import repositories (for loading data at startup)
const patientRepository = require("./src/repositories/patient.repository");
const doctorRepository = require("./src/repositories/doctor.repository");
const adminRepository = require("./src/repositories/admin.repository");
const specializationRepository = require("./src/repositories/specialization.repository");
const auditLogRepository = require("./src/repositories/auditLog.repository");
const slotRepository = require("./src/repositories/slot.repository");
const appointmentRepository = require("./src/repositories/appointment.repository");
const leaveRepository = require("./src/repositories/leave.repository");
const notificationRepository = require("./src/repositories/notification.repository");
const billingRepository = require("./src/repositories/billing.repository");

// Import routes
const apiRoutes = require("./src/routes");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware (simple console log) -> Logs the request that comes in to the server
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use("/api", apiRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Hospital Management System API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      unifiedLogin: "POST /api/auth/login (all user types)",
      patientRegistration: "POST /api/patients/register",
      patientLogin: "POST /api/patients/login (backward compatible)",
      doctorRegistration: "POST /api/doctors/register",
      patients: "GET /api/patients (protected)",
      doctors: "GET /api/doctors (protected - admin only)",
      approvedDoctors: "GET /api/doctors/approved (public)",
      adminPatients: "GET /api/admin/patients (admin only)",
      adminPatientDetails: "GET /api/admin/patients/:id (admin only)",
      adminTogglePatientStatus:
        "PATCH /api/admin/patients/:id/status (admin only)",
    },
  });
});

// 404 handler - for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    errors: [
      {
        field: "route",
        message: "Routesssss not found",
      },
    ],
  });
});

// Global error handler - catches all unhandled errors
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    errors: [
      {
        field: "general",
        message: "An unexpected error occurred",
      },
    ],
  });
});

/**
 * Initialize server
 * Load all data into memory before starting the server
 */
async function startServer() {
  try {
    console.log("🚀 Starting Hospital Management System Server...\n");

    // Load all data into memory
    console.log("📂 Loading data from JSON files...");
    await specializationRepository.loadData();
    await patientRepository.loadData();
    await doctorRepository.loadData();
    await adminRepository.loadData();
    await auditLogRepository.loadData();
    await slotRepository.loadData();
    await appointmentRepository.loadData();
    await leaveRepository.loadData();
    await notificationRepository.loadData();
    await billingRepository.loadData();

    console.log("\n✅ All data loaded successfully\n");

    // Start listening
    app.listen(PORT, () => {
      console.log(`🌐 Server is running on http://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api/health`);
      console.log(`\n🔥 Ready to accept requests!\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n🛑 Shutting down gracefully...");
  process.exit(0);
});
