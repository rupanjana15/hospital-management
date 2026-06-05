/**
 * Billing Routes
 * Defines API endpoints for bill management
 */

const express = require("express");
const router = express.Router();
const billingService = require("../services/billing.service");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Billing management routes

// Get bill by ID
router.get("/:billId", authenticateToken, (req, res) => {
  try {
    const { billId } = req.params;
    const bill = billingService.getBillById(billId);

    // Verify authorization (patient or doctor involved in the bill)
    const userId = req.user.userId;
    if (
      bill.patientId !== userId &&
      bill.doctorId !== userId &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only view your own bills",
      });
    }

    res.status(200).json({
      success: true,
      bill,
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(404).json({
      success: false,
      message: error.message || "Bill not found",
    });
  }
});

// Get bills by patient ID
router.get("/patients/:patientId", authenticateToken, (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Verify authorization
    if (req.user.role === "PATIENT" && req.user.userId !== patientId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only view your own bills",
      });
    }

    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const bills = billingService.getBillsByPatientId(patientId, filters);

    res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    console.error("Error fetching patient bills:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch bills",
    });
  }
});

// Get bills by doctor ID
router.get("/doctors/:doctorId", authenticateToken, (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Verify authorization
    if (req.user.role === "DOCTOR" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only view your own bills",
      });
    }

    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const bills = billingService.getBillsByDoctorId(doctorId, filters);

    res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    console.error("Error fetching doctor bills:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch bills",
    });
  }
});

// Mark bill as paid (admin only)
router.patch("/:billId/pay", authenticateToken, async (req, res) => {
  try {
    // Only admins can mark bills as paid
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only PATIENT can mark bills as paid",
      });
    }

    const { billId } = req.params;
    const { paymentMethod, transactionRef } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod is required",
      });
    }

    const bill = await billingService.markBillAsPaid(
      billId,
      paymentMethod,
      transactionRef
    );

    res.status(200).json({
      success: true,
      message: "Bill marked as paid",
      bill: bill.toJSON(),
    });
  } catch (error) {
    console.error("Error marking bill as paid:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to mark bill as paid",
    });
  }
});

// Get billing statistics for a doctor
router.get(
  "/doctors/:doctorId/billing-stats",
  authenticateToken,
  (req, res) => {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      // Verify authorization
      if (req.user.role === "DOCTOR" && req.user.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only view your own billing stats",
        });
      }

      const dateRange = {};
      if (startDate) dateRange.startDate = startDate;
      if (endDate) dateRange.endDate = endDate;

      const stats = billingService.getDoctorBillingStats(doctorId, dateRange);

      res.status(200).json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Error fetching billing stats:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch billing stats",
      });
    }
  }
);

// Get billing statistics for a patient
router.get(
  "/patients/:patientId/billing-stats",
  authenticateToken,
  (req, res) => {
    try {
      const { patientId } = req.params;
      const { startDate, endDate } = req.query;

      // Verify authorization
      if (req.user.role === "PATIENT" && req.user.userId !== patientId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only view your own billing stats",
        });
      }

      const dateRange = {};
      if (startDate) dateRange.startDate = startDate;
      if (endDate) dateRange.endDate = endDate;

      const stats = billingService.getPatientBillingStats(patientId, dateRange);

      res.status(200).json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Error fetching billing stats:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch billing stats",
      });
    }
  }
);

module.exports = router;
