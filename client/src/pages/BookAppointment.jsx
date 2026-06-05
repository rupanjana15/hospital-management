import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  IndianRupee,
  User,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { doctorService, appointmentService } from "../services/api";

const BookAppointment = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchDoctorDetails = async () => {
    try {
      setIsLoadingDoctor(true);
      const response = await doctorService.getDoctorById(doctorId);
      if (response.success && response.data.doctor) {
        setDoctor(response.data.doctor);
      } else {
        toast.error("Doctor not found");
        navigate("/patient/find-doctors");
      }
    } catch (error) {
      console.error("Error fetching doctor:", error);
      toast.error("Failed to load doctor details");
      navigate("/patient/find-doctors");
    } finally {
      setIsLoadingDoctor(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setIsLoadingSlots(true);

      // Format date as YYYY-MM-DD in local timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const response = await doctorService.getSlots(
        doctorId,
        dateString,
        dateString,
        "AVAILABLE"
      );

      if (response.success) {
        // Handle nested slot structure: response.slots[date] instead of response.data.slots
        const slotsData = response.slots || response.data?.slots || {};
        const slotsForDate = slotsData[dateString] || [];
        setSlots(slotsForDate);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to load available slots");
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleBookAppointment = async () => {
    // Validation
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      toast.error("Please enter a reason (minimum 10 characters)");
      return;
    }

    // Check 30-minute advance booking
    const slotDateTime = new Date(
      `${selectedSlot.date}T${selectedSlot.startTime}`
    );
    const now = new Date();
    const diffMinutes = (slotDateTime - now) / (1000 * 60);

    if (diffMinutes < 30) {
      toast.error("Cannot book slots less than 30 minutes in advance");
      return;
    }

    try {
      setIsBooking(true);
      const patientId = sessionStorage.getItem("userId");

      const bookingData = {
        patientId: patientId,
        slotId: selectedSlot.id,
        reason: reason.trim(),
      };

      // Call the booking API
      const response = await appointmentService.bookAppointment(bookingData);

      if (response.success) {
        setBookingDetails(response.appointment);
      } else {
        throw new Error(response.message || "Booking failed");
      }
      setShowSuccessModal(true);
      toast.success("Appointment booked successfully!");
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(
        error?.errors?.[0]?.message ||
          "Failed to book appointment. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateSelect = (date) => {
    if (date < today) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    return date < today;
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
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

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoadingDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading doctor details...</p>
        </div>
      </div>
    );
  }

  const groupedSlots = selectedDate ? groupSlotsByTimeOfDay(slots) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/patient/find-doctors")}
              className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">
                Book Appointment
              </h1>
              <p className="text-sm text-gray-400">
                Select a date and time for your consultation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Doctor Info Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                {doctor?.fullName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4 text-secondary-400" />
                  <span>{doctor?.qualification}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gold-400" />
                  <span>{doctor?.experienceYears} years experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-secondary-400" />
                  <span className="text-lg font-semibold text-gray-200">
                    ₹{doctor?.consultationFee}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-100 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-400" />
              SELECT DATE
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousMonth}
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
                onClick={handleNextMonth}
                className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
            {getDaysInMonth(currentMonth).map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateSelect(date)}
                disabled={isDateDisabled(date)}
                className={`
                  aspect-square p-2 rounded-lg text-sm font-medium transition-all
                  ${
                    !date
                      ? "invisible"
                      : isDateDisabled(date)
                      ? "text-gray-600 cursor-not-allowed"
                      : isDateSelected(date)
                      ? "bg-primary-500 text-white border-2 border-primary-400"
                      : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-primary-500/50"
                  }
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots Section */}
        {selectedDate && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-100 mb-2 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gold-400" />
              AVAILABLE TIME SLOTS
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {formatDate(selectedDate)}
            </p>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  No available slots for this date
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Please select another date
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Morning Slots */}
                {groupedSlots.morning.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">
                      Morning ({groupedSlots.morning.length} available)
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {groupedSlots.morning.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            px-4 py-3 rounded-lg text-sm font-medium transition-all
                            ${
                              selectedSlot?.id === slot.id
                                ? "bg-primary-500 text-white border-2 border-primary-400"
                                : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-primary-500/50"
                            }
                          `}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {groupedSlots.afternoon.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">
                      Afternoon ({groupedSlots.afternoon.length} available)
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {groupedSlots.afternoon.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            px-4 py-3 rounded-lg text-sm font-medium transition-all
                            ${
                              selectedSlot?.id === slot.id
                                ? "bg-primary-500 text-white border-2 border-primary-400"
                                : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-primary-500/50"
                            }
                          `}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {groupedSlots.evening.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">
                      Evening ({groupedSlots.evening.length} available)
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {groupedSlots.evening.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            px-4 py-3 rounded-lg text-sm font-medium transition-all
                            ${
                              selectedSlot?.id === slot.id
                                ? "bg-primary-500 text-white border-2 border-primary-400"
                                : "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-primary-500/50"
                            }
                          `}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reason Section */}
        {selectedSlot && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-secondary-400" />
              REASON FOR VISIT
              <span className="text-red-400 ml-1">*</span>
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe your symptoms or reason for consultation (minimum 10 characters)"
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              {reason.length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Booking Summary & Actions */}
        {selectedSlot && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Consultation Fee</p>
                <p className="text-3xl font-bold text-secondary-400 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {doctor?.consultationFee}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Selected Slot</p>
                <p className="text-lg font-semibold text-gray-200">
                  {formatTime(selectedSlot.startTime)} -{" "}
                  {formatTime(selectedSlot.endTime)}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedDate.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/patient/find-doctors")}
                disabled={isBooking}
                className="flex-1 px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={
                  isBooking || !reason.trim() || reason.trim().length < 10
                }
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Success Modal */}
      {showSuccessModal && bookingDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-secondary-500/20 border border-secondary-500/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-secondary-400" />
                </div>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/patient/dashboard");
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-gray-100 mb-2">
                Booking Confirmed!
              </h3>
              <p className="text-gray-400 mb-6">
                Your appointment has been successfully booked
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-400">Doctor</span>
                  <span className="text-sm font-medium text-gray-200">
                    {bookingDetails.doctorName}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-400">Date</span>
                  <span className="text-sm font-medium text-gray-200">
                    {new Date(bookingDetails.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-400">Time</span>
                  <span className="text-sm font-medium text-gray-200">
                    {formatTime(bookingDetails.startTime)} -{" "}
                    {formatTime(bookingDetails.endTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-400">Fee</span>
                  <span className="text-sm font-medium text-secondary-400">
                    ₹{bookingDetails.consultationFee}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-400">Bill ID</span>
                  <span className="text-sm font-mono text-gray-200">
                    {bookingDetails.billId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/patient/dashboard");
                }}
                className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
