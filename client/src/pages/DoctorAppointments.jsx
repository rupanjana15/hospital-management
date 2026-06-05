import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Search,
  CheckCircle,
  X,
  RefreshCw,
  Phone,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { toast } from "react-toastify";
import { doctorService, appointmentService } from "../services/api";

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filterAppointments = useCallback(() => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Date filter
    const today = new Date().toISOString().split("T")[0];
    if (dateFilter === "TODAY") {
      filtered = filtered.filter((apt) => apt.appointmentDate === today);
    } else if (dateFilter === "UPCOMING") {
      filtered = filtered.filter((apt) => apt.appointmentDate > today);
    } else if (dateFilter === "PAST") {
      filtered = filtered.filter((apt) => apt.appointmentDate < today);
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patientName?.toLowerCase().includes(search) ||
          apt.reason?.toLowerCase().includes(search) ||
          apt.patientPhone?.includes(search)
      );
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [appointments, statusFilter, dateFilter, searchTerm]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, dateFilter, searchTerm, filterAppointments]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails(appointmentId);
    }
  }, [appointmentId]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const userId = sessionStorage.getItem("userId");
      const response = await doctorService.getAppointments(userId);

      if (response.success) {
        const allAppointments = response.appointments || [];
        // Sort by date and time (newest first)
        allAppointments.sort((a, b) => {
          const dateCompare = b.appointmentDate.localeCompare(
            a.appointmentDate
          );
          if (dateCompare !== 0) return dateCompare;
          return b.startTime.localeCompare(a.startTime);
        });

        setAppointments(allAppointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // Only show toast if not a silent error (network errors during page load)
      if (!error.silent) {
        toast.error("Failed to load appointments");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointmentDetails = async (id) => {
    try {
      const response = await appointmentService.getAppointmentDetails(id);
      if (response.success) {
        setSelectedAppointment(response.appointment);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      toast.error("Failed to load appointment details");
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (
      !window.confirm(
        "Are you sure you want to mark this appointment as completed?"
      )
    ) {
      return;
    }

    try {
      setIsCompleting(true);
      const response = await appointmentService.completeAppointment(
        appointmentId
      );

      if (response.success) {
        toast.success("Appointment marked as completed!");
        setShowDetailModal(false);
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh the list
      }
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Failed to complete appointment");
    } finally {
      setIsCompleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "text-secondary-400 bg-secondary-500/10 border-secondary-500/20";
      case "COMPLETED":
        return "text-primary-400 bg-primary-500/10 border-primary-500/20";
      case "CANCELLED":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "PENDING":
        return "text-gold-400 bg-gold-500/10 border-gold-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimeUntilAppointment = (appointmentDate, startTime) => {
    const aptDateTime = new Date(`${appointmentDate}T${startTime}`);
    const now = new Date();
    const diffMs = aptDateTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return `in ${diffDays} days`;
    } else if (diffDays === 1) {
      return "tomorrow";
    } else if (diffHours > 1) {
      return `in ${diffHours} hours`;
    } else if (diffHours > 0) {
      return "soon";
    } else {
      return "past";
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userId");
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/doctor/dashboard")}
                className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">
                  All Appointments
                </h1>
                <p className="text-sm text-gray-400">
                  Manage all your appointments
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAppointments}
                disabled={isLoading}
                className="p-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => navigate("/doctor/profile")}
                className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                title="Profile"
              >
                <User className="w-5 h-5 text-secondary-400" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, phone, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
              >
                <option value="ALL">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="w-full lg:w-48">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="PAST">Past</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading appointments...</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-4">
              <p className="text-sm text-gray-400">
                Showing{" "}
                <span className="text-primary-400 font-semibold">
                  {paginatedAppointments.length}
                </span>{" "}
                of{" "}
                <span className="text-primary-400 font-semibold">
                  {filteredAppointments.length}
                </span>{" "}
                appointments
              </p>
            </div>

            {paginatedAppointments.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  No appointments found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all animate-fade-in"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Left Section - Patient & Appointment Info */}
                      <div className="flex-1">
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="w-14 h-14 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-7 h-7 text-primary-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-100 mb-1">
                              {appointment.patientName}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                              <Phone className="w-4 h-4 text-secondary-400" />
                              <span>{appointment.patientPhone}</span>
                            </div>
                            <div className="inline-flex items-center px-2 py-1 bg-secondary-500/10 border border-secondary-500/20 rounded text-xs text-secondary-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeUntilAppointment(
                                appointment.appointmentDate,
                                appointment.startTime
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Appointment Details Grid */}
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                            <Calendar className="w-4 h-4 text-primary-400" />
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm font-medium text-gray-200">
                                {formatDate(appointment.appointmentDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                            <Clock className="w-4 h-4 text-primary-400" />
                            <div>
                              <p className="text-xs text-gray-500">Time</p>
                              <p className="text-sm font-medium text-gray-200">
                                {formatTime(appointment.startTime)} -{" "}
                                {formatTime(appointment.endTime)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 md:col-span-2">
                            <FileText className="w-4 h-4 text-gold-400" />
                            <div>
                              <p className="text-xs text-gray-500">Reason</p>
                              <p className="text-sm font-medium text-gray-200">
                                {appointment.reason}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Required Warning */}
                        {appointment.requiresAction &&
                          appointment.actionReason && (
                            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="text-sm font-bold text-red-300 mb-1">
                                    Appointment Action Required from Patient
                                    Side - Leave Applied by Doctor
                                  </h4>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex lg:flex-col gap-3 lg:w-48">
                        <button
                          onClick={() =>
                            fetchAppointmentDetails(appointment.id)
                          }
                          className="flex-1 lg:w-full px-4 py-3 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-lg hover:bg-secondary-500/20 transition-colors flex items-center justify-center space-x-2"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            View Details
                          </span>
                        </button>
                        <span
                          className={`px-3 py-2 text-xs rounded border text-center ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    {/* Appointment ID & Created At */}
                    <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
                      <span>Appointment ID: {appointment.id}</span>
                      <span>
                        Booked on:{" "}
                        {new Date(appointment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? "bg-secondary-500 text-white"
                          : "bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Appointment Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full my-8 animate-fade-in">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-100">
                    Appointment Details
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    ID: {selectedAppointment.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary-400" />
                  Patient Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-lg font-medium text-gray-100">
                      {selectedAppointment.patientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-lg font-medium text-gray-100">
                      {selectedAppointment.patientPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-secondary-400" />
                  Appointment Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-lg font-medium text-gray-100">
                      {formatDate(selectedAppointment.appointmentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="text-lg font-medium text-gray-100">
                      {formatTime(selectedAppointment.startTime)} -{" "}
                      {formatTime(selectedAppointment.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-3 py-1 text-sm rounded border ${getStatusColor(
                        selectedAppointment.status
                      )}`}
                    >
                      {selectedAppointment.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reason</p>
                    <p className="text-lg font-medium text-gray-100">
                      {selectedAppointment.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Required Warning */}
              {selectedAppointment.requiresAction &&
                selectedAppointment.actionReason && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-red-300 mb-1">
                          Appointment Action Required - Leave Applied
                        </h4>
                        <p className="text-sm text-red-200">
                          {selectedAppointment.actionReason}. Please cancel or
                          reschedule this appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Additional Info */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-100">
                      {new Date(selectedAppointment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="text-gray-100">
                      {new Date(selectedAppointment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedAppointment.billId && (
                    <div className="md:col-span-2">
                      <p className="text-gray-500">Bill ID</p>
                      <p className="text-gray-100">
                        {selectedAppointment.billId}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                {selectedAppointment.status === "CONFIRMED" && (
                  <button
                    onClick={() =>
                      handleCompleteAppointment(selectedAppointment.id)
                    }
                    disabled={isCompleting}
                    className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Completing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Complete Appointment</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
