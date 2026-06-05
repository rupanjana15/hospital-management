import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Bell,
  X,
  LogOut,
  User,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import { doctorService } from "../services/api";

const ApplyLeave = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userRole");

    if (!token || role !== "DOCTOR") {
      toast.error("Please login as a doctor");
      navigate("/login");
      return;
    }

    fetchLeaves();
  }, [navigate]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      const response = await doctorService.getLeaves(userId);

      if (response.success) {
        // Sort leaves by startDate (newest first)
        const sortedLeaves = (response.leaves || []).sort((a, b) => {
          return new Date(b.startDate) - new Date(a.startDate);
        });
        setLeaves(sortedLeaves);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    // Validation
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    if (!leaveForm.reason.trim()) {
      toast.error("Please provide a reason for leave");
      return;
    }

    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      const response = await doctorService.applyLeave(userId, leaveForm);

      if (response.success) {
        toast.success(response.message || "Leave applied successfully!");

        // Show summary
        if (response.summary) {
          const { blockedSlots, affectedAppointments, notificationsSent } =
            response.summary;
          toast.info(
            `${blockedSlots} slots blocked, ${affectedAppointments} appointments affected`,
            { autoClose: 5000 }
          );
        }

        setShowApplyModal(false);
        setLeaveForm({ startDate: "", endDate: "", reason: "" });
        fetchLeaves();
      }
    } catch (error) {
      console.error("Error applying leave:", error);
      toast.error(error.errors?.[0]?.message || "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this leave? This will unblock all slots and restore appointments."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      const response = await doctorService.cancelLeave(userId, leaveId);

      if (response.success) {
        toast.success(response.message || "Leave cancelled successfully!");
        fetchLeaves();
      }
    } catch (error) {
      console.error("Error cancelling leave:", error);
      toast.error(error.errors?.[0]?.message || "Failed to cancel leave");
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: {
        color: "text-secondary-400 bg-secondary-500/10 border-secondary-500/20",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      PENDING: {
        color: "text-gold-400 bg-gold-500/10 border-gold-500/20",
        icon: <Clock className="w-3 h-3" />,
      },
      REJECTED: {
        color: "text-red-400 bg-red-500/10 border-red-500/20",
        icon: <X className="w-3 h-3" />,
      },
      CANCELLED: {
        color: "text-gray-400 bg-gray-500/10 border-gray-500/20",
        icon: <X className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${config.color}`}
      >
        {config.icon}
        {status}
      </span>
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userId");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/doctor/dashboard")}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">
                  Leave Management
                </h1>
                <p className="text-sm text-gray-400">
                  Apply and manage your leaves
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/doctor/profile")}
                className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                title="Profile"
              >
                <User className="w-5 h-5 text-secondary-400" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Apply Leave Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 shadow-lg shadow-secondary-500/30 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Leaves</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">
                  {leaves.length}
                </p>
              </div>
              <div className="bg-secondary-500/10 border border-secondary-500/20 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-secondary-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Affected Appointments</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">
                  {leaves
                    .filter((leave) => leave.status === "APPROVED")
                    .reduce(
                      (sum, leave) =>
                        sum + (leave.affectedAppointmentsCount || 0),
                      0
                    )}
                </p>
              </div>
              <div className="bg-gold-500/10 border border-gold-500/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-gold-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Blocked Slots</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">
                  {leaves
                    .filter((leave) => leave.status === "APPROVED")
                    .reduce(
                      (sum, leave) => sum + (leave.affectedSlotsCount || 0),
                      0
                    )}
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Leaves List */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-secondary-400" />
            Your Leaves
          </h2>

          {leaves.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No leaves applied yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Click "Apply for Leave" to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  className={`bg-gray-900/50 border rounded-lg p-4 hover:bg-gray-700/30 transition-all ${
                    leave.status === "CANCELLED"
                      ? "border-gray-600 opacity-60"
                      : "border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">
                          {new Date(leave.startDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          -{" "}
                          {new Date(leave.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </h3>
                        {getStatusBadge(leave.status)}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {calculateDays(leave.startDate, leave.endDate)} days
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {leave.affectedSlotsCount || 0} slots blocked
                        </span>
                        {(leave.affectedAppointmentsCount || 0) > 0 && (
                          <span className="flex items-center text-gold-400">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {leave.affectedAppointmentsCount} appointments
                            affected
                          </span>
                        )}
                      </div>

                      <div className="flex items-start space-x-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                        <p className="text-gray-300">
                          <span className="font-medium">Reason:</span>{" "}
                          {leave.reason}
                        </p>
                      </div>

                      {(leave.affectedAppointmentsCount || 0) > 0 && (
                        <div className="mt-3 bg-gold-500/10 border border-gold-500/20 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Bell className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gold-300">
                              {leave.affectedAppointmentsCount} patient(s) have
                              been notified to reschedule their appointments
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {leave.status === "APPROVED" && (
                      <button
                        onClick={() => handleCancelLeave(leave.id)}
                        disabled={loading}
                        className="ml-4 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cancel Leave"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-secondary-400" />
                Apply for Leave
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, startDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, endDate: e.target.value })
                    }
                    min={
                      leaveForm.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
              </div>

              {/* Days Preview */}
              {leaveForm.startDate && leaveForm.endDate && (
                <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-3">
                  <p className="text-sm text-secondary-300">
                    <span className="font-semibold">Duration:</span>{" "}
                    {calculateDays(leaveForm.startDate, leaveForm.endDate)}{" "}
                    day(s)
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, reason: e.target.value })
                  }
                  rows="4"
                  placeholder="Please provide a reason for your leave..."
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 resize-none"
                />
              </div>

              {/* Warning */}
              <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gold-300">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-gold-400">
                      <li>All available slots will be blocked</li>
                      <li>
                        Patients with booked appointments will be notified
                      </li>
                      <li>Affected appointments will require rescheduling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleApplyLeave}
                disabled={loading}
                className="flex-1 bg-secondary-600 text-white py-2.5 rounded-lg hover:bg-secondary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Applying..." : "Apply Leave"}
              </button>
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-6 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
