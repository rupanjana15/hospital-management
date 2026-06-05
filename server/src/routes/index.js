/**
 * Main Routes Index
 * Aggregates all route modules
 */

const express = require("express");
const router = express.Router();
const patientRoutes = require("./patient.routes");
const doctorRoutes = require("./doctor.routes");
const authRoutes = require("./auth.routes");
const specializationRoutes = require("./specialization.routes");
const adminRoutes = require("./admin.routes");
const slotRoutes = require("./slot.routes");
const appointmentRoutes = require("./appointment.routes");
const billingRoutes = require("./billing.routes");

// Mount auth routes (unified login)
router.use("/auth", authRoutes);

// Mount patient routes
router.use("/patients", patientRoutes);

// Mount doctor routes
router.use("/doctors", doctorRoutes);

// Mount specialization routes
router.use("/specializations", specializationRoutes);

// Mount admin routes
router.use("/admin", adminRoutes);

// Mount slot and leave routes
router.use("/", slotRoutes);

// Mount appointment routes
router.use("/", appointmentRoutes);

// Mount billing routes
router.use("/bills", billingRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
