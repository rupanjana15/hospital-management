import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  FileText,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { patientService, billService } from "../services/api";
import PaymentModal from "../components/PaymentModal";
import BillReceiptModal from "../components/BillReceiptModal";

const AppointmentHistory = () => {
  const navigate = useNavigate();
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receiptBill, setReceiptBill] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const role = sessionStorage.getItem("userRole");

    if (!userId || role !== "PATIENT") {
      toast.error("Please login as a patient");
      navigate("/login");
      return;
    }

    fetchAppointmentHistory(userId);
    fetchBills(userId);
  }, [navigate]);

  const fetchAppointmentHistory = async (patientId) => {
    try {
      setLoading(true);
      // Get all completed appointments (no date limit)
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2); // Get last 2 years
      const startDateStr = startDate.toISOString().split("T")[0];

      const response = await patientService.getAppointments(
        patientId,
        "COMPLETED",
        startDateStr,
        endDate
      );

      if (response.success) {
        // Sort by date descending (most recent first)
        const sorted = (response.appointments || []).sort((a, b) => {
          const dateA = new Date(a.appointmentDate);
          const dateB = new Date(b.appointmentDate);
          return dateB - dateA;
        });
        setAppointmentHistory(sorted);
      }
    } catch (error) {
      console.error("Error fetching appointment history:", error);
      toast.error("Failed to load appointment history");
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async (patientId) => {
    try {
      const response = await billService.getPatientBills(patientId);
      if (response.success) {
        setBills(response.bills || []);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const getBillForAppointment = (appointmentId) => {
    return bills.find((bill) => bill.appointmentId === appointmentId);
  };

  const handlePayBill = async (billId, paymentData) => {
    try {
      const response = await billService.payBill(billId, paymentData);
      if (response.success) {
        toast.success("Payment successful!");
        const userId = sessionStorage.getItem("userId");
        fetchBills(userId);
      }
    } catch (error) {
      console.error("Error paying bill:", error);
      throw new Error(error.response?.data?.message || "Payment failed");
    }
  };

  const handleViewReceipt = async (billId) => {
    try {
      const fullBillDetails = bills.find((b) => b.id === billId);
      if (fullBillDetails) {
        setReceiptBill(fullBillDetails);
        setShowReceiptModal(true);
      } else {
        toast.error("Bill details not found");
      }
    } catch (error) {
      console.error("Error fetching bill details:", error);
      toast.error("Failed to load receipt");
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/patient/dashboard")}
              className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-gold-500/10 border border-gold-500/20 p-2 rounded-lg">
                <Clock className="w-6 h-6 text-gold-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-100">
                Appointment History
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
              <p className="text-gray-400">Loading appointment history...</p>
            </div>
          ) : appointmentHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                No appointment history
              </h3>
              <p className="text-gray-400 mb-6">
                You haven't completed any appointments yet
              </p>
              <button
                onClick={() => navigate("/patient/find-doctors")}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Book an Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointmentHistory.map((appointment, index) => {
                const bill = getBillForAppointment(appointment.id);
                return (
                  <div
                    key={appointment.id}
                    className="p-5 bg-gray-900/50 border border-gray-700/50 rounded-xl hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="relative">
                          <div className="w-4 h-4 bg-secondary-500 rounded-full mt-1"></div>
                          {index !== appointmentHistory.length - 1 && (
                            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-0.5 h-20 bg-gray-700"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-12 h-12 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-primary-400" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-gray-100">
                                {appointment.doctorName}
                              </p>
                              <p className="text-sm text-gray-400">
                                {appointment.doctorSpecialization}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(appointment.appointmentDate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>
                                {appointment.startTime} - {appointment.endTime}
                              </span>
                            </div>
                          </div>
                          {appointment.reason && (
                            <div className="mt-3 flex items-start space-x-2">
                              <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                              <p className="text-sm text-gray-400">
                                <span className="font-medium text-gray-300">
                                  Reason:{" "}
                                </span>
                                {appointment.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1.5 text-sm rounded-lg border bg-secondary-500/10 border-secondary-500/20 text-secondary-400 whitespace-nowrap">
                        Completed
                      </span>
                    </div>

                    {/* Bill Status and Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        {bill ? (
                          bill.status === "PAID" ? (
                            <span className="text-sm px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>PAID</span>
                            </span>
                          ) : (
                            <span className="text-sm px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400">
                              PENDING - {formatAmount(bill.amount)}
                            </span>
                          )
                        ) : (
                          <span className="text-sm px-3 py-1.5 rounded-lg bg-gray-700/30 border border-gray-600 text-gray-500">
                            No Bill
                          </span>
                        )}
                      </div>

                      {bill && (
                        <div>
                          {bill.status === "PAID" ? (
                            <button
                              onClick={() => handleViewReceipt(bill.id)}
                              className="px-4 py-2 text-sm bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              View Receipt
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const transformedBill = {
                                  ...bill,
                                  doctorName: bill.doctor?.name || "N/A",
                                  doctorSpecialization:
                                    bill.doctor?.specialization || "N/A",
                                  appointmentDate:
                                    bill.appointment?.date || bill.createdAt,
                                };
                                setSelectedBill(transformedBill);
                                setShowPaymentModal(true);
                              }}
                              className="px-4 py-2 text-sm bg-gold-500/10 border border-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/20 transition-colors flex items-center space-x-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Pay Bill</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        onPaymentSuccess={handlePayBill}
      />

      {/* Bill Receipt Modal */}
      <BillReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setReceiptBill(null);
        }}
        bill={receiptBill}
      />
    </div>
  );
};

export default AppointmentHistory;
