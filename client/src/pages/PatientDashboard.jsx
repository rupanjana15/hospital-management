import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Calendar,
  Activity,
  Bell,
  Search,
  FileText,
  CreditCard,
  Clock,
  ArrowRight,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  patientService,
  billService,
  appointmentService,
  doctorService,
} from "../services/api";
import PaymentModal from "../components/PaymentModal";
import BillReceiptModal from "../components/BillReceiptModal";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: "",
    id: "",
  });
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receiptBill, setReceiptBill] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [upcomingAppointmentsCount, setUpcomingAppointmentsCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [isLoadingNextAppointment, setIsLoadingNextAppointment] =
    useState(true);
  const [pendingBillsTotal, setPendingBillsTotal] = useState(0);

  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // Get user info from sessionStorage
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userRole");
    const name = sessionStorage.getItem("userName");
    const id = sessionStorage.getItem("userId");

    if (!token || role !== "PATIENT") {
      toast.error("Please login as a patient");
      navigate("/login");
      return;
    }

    setUserInfo({ name, role, id });
    fetchAppointmentHistory(id);
    fetchBills(id);
    fetchUpcomingAppointmentsCount();
    fetchNextAppointment(id);
  }, [navigate]);

  const fetchUpcomingAppointmentsCount = async () => {
    try {
      const response = await patientService.getUpcomingAppointmentsCount();
      if (response.success) {
        setUpcomingAppointmentsCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching upcoming appointments count:", error);
    }
  };

  const fetchNextAppointment = async (patientId) => {
    try {
      setIsLoadingNextAppointment(true);
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
        const pendingWithAction = (pendingResponse.appointments || []).filter(
          (apt) => apt.requiresAction === true
        );
        allAppointments = [...allAppointments, ...pendingWithAction];
      }

      // Filter only upcoming appointments
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

      // Get the first (next) appointment
      setNextAppointment(upcoming[0] || null);
    } catch (error) {
      console.error("Error fetching next appointment:", error);
    } finally {
      setIsLoadingNextAppointment(false);
    }
  };

  const fetchAppointmentHistory = async (patientId) => {
    try {
      // Get last 3 months of completed appointments
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
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
        setAppointmentHistory(sorted.slice(0, 4)); // Show last 4
      }
    } catch (error) {
      console.error("Error fetching appointment history:", error);
    }
  };

  const fetchBills = async (patientId) => {
    try {
      const response = await billService.getPatientBills(patientId);
      if (response.success) {
        console.log("Fetched bills:", response.bills);
        const allBills = response.bills || [];
        setBills(allBills);

        // Calculate total pending bills amount
        const pendingTotal = allBills
          .filter((bill) => bill.status === "PENDING")
          .reduce((sum, bill) => sum + (bill.amount || 0), 0);
        setPendingBillsTotal(pendingTotal);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const handlePayBill = async (billId, paymentData) => {
    try {
      const response = await billService.payBill(billId, paymentData);
      if (response.success) {
        toast.success("Payment successful!");
        // Refresh bills
        fetchBills(userInfo.id);
      }
    } catch (error) {
      console.error("Error paying bill:", error);
      throw new Error(error.response?.data?.message || "Payment failed");
    }
  };

  const handleViewReceipt = async (billId) => {
    try {
      // Fetch full bill details with all related data
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

  const getBillForAppointment = (appointmentId) => {
    console.log("Looking for bill for appointment:", appointmentId);
    console.log("Available bills:", bills);
    const foundBill = bills.find(
      (bill) => bill.appointmentId === appointmentId
    );
    console.log("Found bill:", foundBill);
    return foundBill;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userId");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Cancel appointment handlers
  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!nextAppointment || !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsCancelling(true);
      const response = await appointmentService.cancelAppointment(
        nextAppointment.id,
        cancelReason
      );

      if (response.success) {
        toast.success("Appointment cancelled successfully");
        setShowCancelModal(false);
        setCancelReason("");
        // Refresh appointment data
        fetchNextAppointment(userInfo.id);
        fetchUpcomingAppointmentsCount();
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.errors?.[0]?.message || "Failed to cancel appointment");
    } finally {
      setIsCancelling(false);
    }
  };

  // Reschedule appointment handlers
  const handleRescheduleClick = () => {
    setShowRescheduleModal(true);
    setCurrentMonth(new Date());
  };

  const fetchAvailableSlotsForReschedule = async (date) => {
    if (!nextAppointment) return;

    try {
      setIsLoadingSlots(true);
      // Format date as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const response = await doctorService.getSlots(
        nextAppointment.doctorId,
        dateString,
        dateString,
        "AVAILABLE"
      );

      if (response.success) {
        // Handle nested slot structure: response.slots[date] instead of response.data.slots
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
    if (!nextAppointment || !selectedSlot) {
      toast.error("Please select a new time slot");
      return;
    }

    try {
      setIsRescheduling(true);
      const response = await appointmentService.rescheduleAppointment(
        nextAppointment.id,
        selectedSlot.id
      );

      if (response.success) {
        toast.success("Appointment rescheduled successfully");
        setShowRescheduleModal(false);
        setRescheduleDate(null);
        setSelectedSlot(null);
        setAvailableSlots([]);
        // Refresh appointment data
        fetchNextAppointment(userInfo.id);
        fetchUpcomingAppointmentsCount();
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error(
        error.errors?.[0]?.message || "Failed to reschedule appointment"
      );
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleDateSelectForReschedule = (date) => {
    setRescheduleDate(date);
    setSelectedSlot(null);
    fetchAvailableSlotsForReschedule(date);
  };

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    } else {
      return "Today";
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
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date) => {
    if (!rescheduleDate) return false;
    return (
      date.getDate() === rescheduleDate.getDate() &&
      date.getMonth() === rescheduleDate.getMonth() &&
      date.getFullYear() === rescheduleDate.getFullYear()
    );
  };

  const groupSlotsByTimeOfDay = (slots) => {
    const morning = slots.filter(
      (s) => parseInt(s.startTime.split(":")[0]) < 12
    );
    const afternoon = slots.filter((s) => {
      const hour = parseInt(s.startTime.split(":")[0]);
      return hour >= 12 && hour < 17;
    });
    const evening = slots.filter(
      (s) => parseInt(s.startTime.split(":")[0]) >= 17
    );
    return { morning, afternoon, evening };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Enhanced Navbar */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="bg-primary-500/10 border border-primary-500/20 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-primary-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-100">
                Patient Dashboard
              </h1>
            </div>

            {/* Right: Search, Notifications, Profile, Logout */}
            <div className="flex items-center space-x-4">
              {/* Profile Icon Button */}
              <button
                onClick={() => navigate("/patient/profile")}
                className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                title="View Profile"
              >
                <div className="w-8 h-8 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-400" />
                </div>
              </button>

              {/* Logout Button */}
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
        {/* Welcome Bar */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <p className="text-sm text-gray-400">
                📅{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h2 className="text-2xl font-bold text-gray-100 mt-1">
                {getGreeting()}, {userInfo.name}! 👋
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Here's your health summary for today
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Upcoming Appointments */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-primary-500/20 hover:border-primary-500/50 transition-all animate-fade-in">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Upcoming
                </p>
                <p className="text-2xl font-bold text-gray-100">
                  {upcomingAppointmentsCount}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Appointments scheduled</p>
          </div>

          {/* Pending Bills */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-gold-500/20 hover:border-gold-500/50 transition-all animate-fade-in">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-gold-500/10 border border-gold-500/20 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Pending Bills
                </p>
                <p className="text-2xl font-bold text-gray-100">
                  {pendingBillsTotal > 0
                    ? `₹${(pendingBillsTotal / 1000).toFixed(1)}K`
                    : "₹0"}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Outstanding payments</p>
          </div>

          {/* Last Checkup */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-secondary-500/20 hover:border-secondary-500/50 transition-all animate-fade-in">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-secondary-500/10 border border-secondary-500/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-secondary-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Last Checkup
                </p>
                <p className="text-2xl font-bold text-gray-100">
                  {appointmentHistory.length > 0
                    ? new Date(
                        appointmentHistory[0].appointmentDate
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Most recent visit</p>
          </div>
        </div>

        {/* Next Appointment Card */}
        <div className="mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-primary-400" />
                NEXT APPOINTMENT
              </h3>
            </div>

            {/* Loading State */}
            {isLoadingNextAppointment && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
                <p className="text-gray-400">Loading appointment...</p>
              </div>
            )}

            {/* No Appointment State */}
            {!isLoadingNextAppointment && !nextAppointment && (
              <div className="text-center py-12">
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

            {/* Appointment Details */}
            {!isLoadingNextAppointment && nextAppointment && (
              <>
                {/* Doctor Leave Warning */}
                {nextAppointment.requiresAction &&
                  nextAppointment.actionReason && (
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

                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-100">
                      {nextAppointment.doctorName}
                    </h4>
                    <p className="text-gray-400 mb-2">
                      {nextAppointment.doctorSpecialization}
                    </p>
                    <div className="inline-flex items-center px-2 py-1 bg-secondary-500/10 border border-secondary-500/20 rounded text-xs text-secondary-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {getTimeUntilAppointment(
                        nextAppointment.appointmentDate,
                        nextAppointment.startTime
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-medium text-gray-200">
                        {formatDate(nextAppointment.appointmentDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                    <Clock className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="text-sm font-medium text-gray-200">
                        {formatTime(nextAppointment.startTime)} -{" "}
                        {formatTime(nextAppointment.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 md:col-span-2">
                    <FileText className="w-5 h-5 text-gold-400" />
                    <div>
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="text-sm font-medium text-gray-200">
                        {nextAppointment.reason}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleRescheduleClick}
                    className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      nextAppointment.requiresAction
                        ? "bg-gold-500 text-white border-2 border-gold-400 hover:bg-gold-600 animate-pulse"
                        : "bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/20"
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reschedule</span>
                  </button>
                  <button
                    onClick={handleCancelClick}
                    className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      nextAppointment.requiresAction
                        ? "bg-red-500 text-white border-2 border-red-400 hover:bg-red-600"
                        : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => navigate("/patient/find-doctors")}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-primary-500/20 hover:border-primary-500/50 transition-all text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                <Search className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-100 mb-1">
                  Find Doctors
                </h4>
                <p className="text-xs text-gray-400">
                  Search and book appointments
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/patient/appointments")}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-secondary-500/20 hover:border-secondary-500/50 transition-all text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-secondary-500/10 border border-secondary-500/20 p-4 rounded-lg group-hover:bg-secondary-500/20 transition-colors">
                <Calendar className="w-7 h-7 text-secondary-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-100 mb-1">
                  View Appointments
                </h4>
                <p className="text-xs text-gray-400">Manage your schedule</p>
              </div>
            </div>
          </button>
        </div>

        {/* Appointment History Section */}
        <div className="mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gold-400" />
                APPOINTMENT HISTORY
              </h3>
              <button
                onClick={() => navigate("/patient/appointment-history")}
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center space-x-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {appointmentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    No appointment history yet
                  </p>
                </div>
              ) : (
                appointmentHistory.map((appointment, index) => {
                  const bill = getBillForAppointment(appointment.id);
                  return (
                    <div
                      key={appointment.id}
                      className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="relative">
                            <div className="w-3 h-3 bg-secondary-500 rounded-full mt-1"></div>
                            {index !== appointmentHistory.length - 1 && (
                              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gray-700"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-100">
                              {appointment.doctorName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                appointment.appointmentDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded border bg-secondary-500/10 border-secondary-500/20 text-secondary-400 whitespace-nowrap">
                          Completed
                        </span>
                      </div>

                      {/* Bill Status and Actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          {bill ? (
                            bill.status === "PAID" ? (
                              <span className="text-xs px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>PAID</span>
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded bg-gold-500/10 border border-gold-500/20 text-gold-400">
                                PENDING - {formatAmount(bill.amount)}
                              </span>
                            )
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-gray-700/30 border border-gray-600 text-gray-500">
                              No Bill
                            </span>
                          )}
                        </div>

                        {bill && (
                          <div>
                            {bill.status === "PAID" ? (
                              <button
                                onClick={() => handleViewReceipt(bill.id)}
                                className="px-3 py-1.5 text-xs bg-gray-700/50 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                              >
                                View Receipt
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  // Transform bill data for payment modal
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
                                className="px-3 py-1.5 text-xs bg-gold-500/10 border border-gold-500/20 text-gold-400 rounded hover:bg-gold-500/20 transition-colors flex items-center space-x-1"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Pay Bill</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
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

      {/* Cancel Appointment Modal */}
      {showCancelModal && nextAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                Cancel Appointment
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold">
                  {nextAppointment.doctorName}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(nextAppointment.appointmentDate)} at{" "}
                {formatTime(nextAppointment.startTime)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for cancellation <span className="text-red-400">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this appointment"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                rows="4"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={isCancelling || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && nextAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full p-6 animate-fade-in my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-gold-400" />
                Reschedule Appointment
              </h3>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate(null);
                  setSelectedSlot(null);
                  setAvailableSlots([]);
                }}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold">
                  {nextAppointment.doctorName}
                </span>{" "}
                - {nextAppointment.doctorSpecialization}
              </p>
              <p className="text-xs text-gray-400">
                Current: {formatDate(nextAppointment.appointmentDate)} at{" "}
                {formatTime(nextAppointment.startTime)}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Select Date
                </h4>
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const newMonth = new Date(currentMonth);
                        newMonth.setMonth(newMonth.getMonth() - 1);
                        setCurrentMonth(newMonth);
                      }}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <span className="text-sm font-semibold text-gray-100">
                      {currentMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => {
                        const newMonth = new Date(currentMonth);
                        newMonth.setMonth(newMonth.getMonth() + 1);
                        setCurrentMonth(newMonth);
                      }}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(currentMonth).map((date, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          date &&
                          !isDateDisabled(date) &&
                          handleDateSelectForReschedule(date)
                        }
                        disabled={!date || isDateDisabled(date)}
                        className={`aspect-square p-2 text-sm rounded-lg transition-colors ${
                          !date
                            ? "invisible"
                            : isDateDisabled(date)
                            ? "text-gray-600 cursor-not-allowed"
                            : isDateSelected(date)
                            ? "bg-primary-500 text-white font-semibold"
                            : "text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {date ? date.getDate() : ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Available Slots */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Available Times
                </h4>
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {!rescheduleDate && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Please select a date to view available time slots
                    </div>
                  )}

                  {rescheduleDate && isLoadingSlots && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-2" />
                      <p className="text-gray-400 text-sm">Loading slots...</p>
                    </div>
                  )}

                  {rescheduleDate &&
                    !isLoadingSlots &&
                    availableSlots.length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No available slots for this date
                      </div>
                    )}

                  {rescheduleDate &&
                    !isLoadingSlots &&
                    availableSlots.length > 0 && (
                      <div className="space-y-4">
                        {(() => {
                          const { morning, afternoon, evening } =
                            groupSlotsByTimeOfDay(availableSlots);
                          return (
                            <>
                              {morning.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-400 mb-2">
                                    Morning
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {morning.map((slot) => (
                                      <button
                                        key={slot.id}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                          selectedSlot?.id === slot.id
                                            ? "bg-primary-500 text-white"
                                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                        }`}
                                      >
                                        {formatTime(slot.startTime)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {afternoon.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-400 mb-2">
                                    Afternoon
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {afternoon.map((slot) => (
                                      <button
                                        key={slot.id}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                          selectedSlot?.id === slot.id
                                            ? "bg-primary-500 text-white"
                                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                        }`}
                                      >
                                        {formatTime(slot.startTime)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {evening.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-400 mb-2">
                                    Evening
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {evening.map((slot) => (
                                      <button
                                        key={slot.id}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                          selectedSlot?.id === slot.id
                                            ? "bg-primary-500 text-white"
                                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                        }`}
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
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate(null);
                  setSelectedSlot(null);
                  setAvailableSlots([]);
                }}
                disabled={isRescheduling}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleConfirm}
                disabled={isRescheduling || !selectedSlot}
                className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rescheduling...</span>
                  </>
                ) : (
                  <span>Confirm Reschedule</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
