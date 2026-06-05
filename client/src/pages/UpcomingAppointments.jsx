import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  patientService,
  appointmentService,
  doctorService,
} from "../services/api";

const UpcomingAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  // Reschedule modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      setIsLoading(true);
      const patientId = sessionStorage.getItem("userId");

      // Get today's date and 3 months ahead
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.setMonth(today.getMonth() + 3))
        .toISOString()
        .split("T")[0];

      // Fetch both CONFIRMED and PENDING appointments
      const [confirmedResponse, pendingResponse] = await Promise.all([
        patientService.getAppointments(
          patientId,
          "CONFIRMED",
          startDate,
          endDate
        ),
        patientService.getAppointments(
          patientId,
          "PENDING",
          startDate,
          endDate
        ),
      ]);

      let allAppointments = [];

      if (confirmedResponse.success) {
        allAppointments = [
          ...allAppointments,
          ...(confirmedResponse.appointments || []),
        ];
      }

      if (pendingResponse.success) {
        // Only include PENDING appointments that require action
        const pendingWithAction = (pendingResponse.appointments || []).filter(
          (apt) => apt.requiresAction === true
        );
        allAppointments = [...allAppointments, ...pendingWithAction];
      }

      // Filter only upcoming appointments (future dates)
      const now = new Date();
      const upcoming = allAppointments.filter((apt) => {
        const aptDateTime = new Date(`${apt.appointmentDate}T${apt.startTime}`);
        return aptDateTime > now;
      });

      // Sort by date and time
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.startTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.startTime}`);
        return dateA - dateB;
      });

      setAppointments(upcoming);
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

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    if (!cancelReason.trim() || cancelReason.trim().length < 10) {
      toast.error("Please provide a reason (minimum 10 characters)");
      return;
    }

    try {
      setCancellingId(selectedAppointment.id);
      const response = await appointmentService.cancelAppointment(
        selectedAppointment.id,
        cancelReason.trim()
      );

      if (response.success) {
        toast.success("Appointment cancelled successfully");
        setShowCancelModal(false);
        setSelectedAppointment(null);
        setCancelReason("");
        fetchUpcomingAppointments();
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to cancel appointment"
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleRescheduleClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    setRescheduleDate(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const fetchAvailableSlotsForReschedule = async (date) => {
    if (!selectedAppointment) return;

    try {
      setIsLoadingSlots(true);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const response = await doctorService.getSlots(
        selectedAppointment.doctorId,
        dateString,
        dateString,
        "AVAILABLE"
      );

      if (response.success) {
        const slotsData = response.slots || response.data?.slots || {};
        const slotsForDate = slotsData[dateString] || [];
        setAvailableSlots(slotsForDate);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to load available slots");
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!selectedSlot) {
      toast.error("Please select a new time slot");
      return;
    }

    try {
      setIsRescheduling(true);
      const response = await appointmentService.rescheduleAppointment(
        selectedAppointment.id,
        selectedSlot.id
      );

      if (response.success) {
        toast.success("Appointment rescheduled successfully");
        setShowRescheduleModal(false);
        setSelectedAppointment(null);
        setRescheduleDate(null);
        setSelectedSlot(null);
        fetchUpcomingAppointments();
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to reschedule appointment"
      );
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleDateSelectForReschedule = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    setRescheduleDate(date);
    setSelectedSlot(null);
    fetchAvailableSlotsForReschedule(date);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date) => {
    if (!date || !rescheduleDate) return false;
    return (
      date.getDate() === rescheduleDate.getDate() &&
      date.getMonth() === rescheduleDate.getMonth() &&
      date.getFullYear() === rescheduleDate.getFullYear()
    );
  };

  const groupSlotsByTimeOfDay = (slots) => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.startTime.split(":")[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
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
    } else {
      return "soon";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/patient/dashboard")}
                className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">
                  Upcoming Appointments
                </h1>
                <p className="text-sm text-gray-400">
                  Manage your scheduled appointments
                </p>
              </div>
            </div>
            <button
              onClick={fetchUpcomingAppointments}
              disabled={isLoading}
              className="p-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading appointments...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && appointments.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              No upcoming appointments
            </h3>
            <p className="text-gray-400 mb-6">
              You don't have any scheduled appointments at the moment
            </p>
            <button
              onClick={() => navigate("/patient/find-doctors")}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Book an Appointment
            </button>
          </div>
        )}

        {/* Appointments List */}
        {!isLoading && appointments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                Showing{" "}
                <span className="text-primary-400 font-semibold">
                  {appointments.length}
                </span>{" "}
                upcoming{" "}
                {appointments.length === 1 ? "appointment" : "appointments"}
              </p>
            </div>

            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all animate-fade-in"
              >
                {/* Doctor Leave Warning */}
                {appointment.requiresAction && appointment.actionReason && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-300 mb-1">
                          Action Required: Doctor on Leave
                        </h4>
                        <p className="text-xs text-red-300/80">
                          Please reschedule or cancel this appointment as soon
                          as possible.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Left Section - Doctor & Appointment Info */}
                  <div className="flex-1">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-14 h-14 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-100 mb-1">
                          {appointment.doctorName}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                          <Stethoscope className="w-4 h-4 text-secondary-400" />
                          <span>{appointment.doctorSpecialization}</span>
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
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex lg:flex-col gap-3 lg:w-48">
                    <button
                      onClick={() => handleRescheduleClick(appointment)}
                      className={`flex-1 lg:w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                        appointment.requiresAction
                          ? "bg-gold-500 text-white border-2 border-gold-400 hover:bg-gold-600 animate-pulse"
                          : "bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/20"
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm font-medium">Reschedule</span>
                    </button>
                    <button
                      onClick={() => handleCancelClick(appointment)}
                      disabled={cancellingId === appointment.id}
                      className={`flex-1 lg:w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        appointment.requiresAction
                          ? "bg-red-500 text-white border-2 border-red-400 hover:bg-red-600"
                          : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">Cancel</span>
                    </button>
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
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-gray-100 mb-2">
                Cancel Appointment?
              </h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to cancel your appointment with{" "}
                <span className="font-semibold text-gray-200">
                  {selectedAppointment.doctorName}
                </span>{" "}
                on{" "}
                <span className="font-semibold text-gray-200">
                  {formatDate(selectedAppointment.appointmentDate)}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for cancellation{" "}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason (minimum 10 characters)"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cancelReason.length}/10 characters minimum
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                  }}
                  disabled={cancellingId === selectedAppointment.id}
                  className="flex-1 px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={
                    cancellingId === selectedAppointment.id ||
                    !cancelReason.trim() ||
                    cancelReason.trim().length < 10
                  }
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {cancellingId === selectedAppointment.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Yes, Cancel</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full my-8 animate-fade-in">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-100">
                    Reschedule Appointment
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedAppointment.doctorName} • Select a new date and
                    time
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedAppointment(null);
                    setRescheduleDate(null);
                    setSelectedSlot(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Calendar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-100 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gold-400" />
                    SELECT NEW DATE
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() - 1,
                            1
                          )
                        )
                      }
                      className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <span className="text-sm font-medium text-gray-300 min-w-[120px] text-center">
                      {currentMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1,
                            1
                          )
                        )
                      }
                      className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        date && handleDateSelectForReschedule(date)
                      }
                      disabled={isDateDisabled(date)}
                      className={`
                        aspect-square p-2 rounded-lg text-sm font-medium transition-all
                        ${
                          !date
                            ? "invisible"
                            : isDateDisabled(date)
                            ? "text-gray-600 cursor-not-allowed"
                            : isDateSelected(date)
                            ? "bg-gold-500 text-white border-2 border-gold-400"
                            : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gold-500/50"
                        }
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {rescheduleDate && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-100 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gold-400" />
                    AVAILABLE TIME SLOTS
                  </h4>

                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">
                        No available slots for this date
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {(() => {
                        const grouped = groupSlotsByTimeOfDay(availableSlots);
                        return (
                          <>
                            {grouped.morning.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-2">
                                  Morning ({grouped.morning.length} available)
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                  {grouped.morning.map((slot) => (
                                    <button
                                      key={slot.id}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`
                                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${
                                          selectedSlot?.id === slot.id
                                            ? "bg-gold-500 text-white border-2 border-gold-400"
                                            : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gold-500/50"
                                        }
                                      `}
                                    >
                                      {formatTime(slot.startTime)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {grouped.afternoon.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-2">
                                  Afternoon ({grouped.afternoon.length}{" "}
                                  available)
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                  {grouped.afternoon.map((slot) => (
                                    <button
                                      key={slot.id}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`
                                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${
                                          selectedSlot?.id === slot.id
                                            ? "bg-gold-500 text-white border-2 border-gold-400"
                                            : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gold-500/50"
                                        }
                                      `}
                                    >
                                      {formatTime(slot.startTime)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {grouped.evening.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-2">
                                  Evening ({grouped.evening.length} available)
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                  {grouped.evening.map((slot) => (
                                    <button
                                      key={slot.id}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`
                                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${
                                          selectedSlot?.id === slot.id
                                            ? "bg-gold-500 text-white border-2 border-gold-400"
                                            : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gold-500/50"
                                        }
                                      `}
                                    >
                                      {formatTime(slot.startTime)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedAppointment(null);
                    setRescheduleDate(null);
                    setSelectedSlot(null);
                  }}
                  disabled={isRescheduling}
                  className="flex-1 px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleConfirm}
                  disabled={isRescheduling || !selectedSlot}
                  className="flex-1 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isRescheduling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Rescheduling...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Confirm Reschedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointments;
