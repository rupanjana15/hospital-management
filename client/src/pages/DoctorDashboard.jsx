import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Activity,
  Play,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { doctorService } from "../services/api";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [chatStatus, setChatStatus] = useState(false);
  const [loadingChatStatus, setLoadingChatStatus] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showingUpcoming, setShowingUpcoming] = useState(false);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  const [completedAppointmentsCount, setCompletedAppointmentsCount] =
    useState(0);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [weeklyAvailability, setWeeklyAvailability] = useState([
    { day: "Mon", slots: 0, bookedSlots: 0, status: "free" },
    { day: "Tue", slots: 0, bookedSlots: 0, status: "free" },
    { day: "Wed", slots: 0, bookedSlots: 0, status: "free" },
    { day: "Thu", slots: 0, bookedSlots: 0, status: "free" },
    { day: "Fri", slots: 0, bookedSlots: 0, status: "free" },
    { day: "Sat", slots: 0, bookedSlots: 0, status: "free" },
    { day: "Sun", slots: 0, bookedSlots: 0, status: "free" },
  ]);
  const [loadingWeeklyAvailability, setLoadingWeeklyAvailability] =
    useState(true);

  useEffect(() => {
    // Get user info from sessionStorage
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userRole");
    const name = sessionStorage.getItem("userName");

    if (!token || role !== "DOCTOR") {
      toast.error("Please login as a doctor");
      navigate("/login");
      return;
    }

    setUserName(name);

    // Fetch profile to get current chat status
    fetchDoctorProfile();
    // Fetch appointments and metrics
    fetchAppointments();
    fetchMetrics();
    fetchWeeklyAvailability();
  }, [navigate]);

  const fetchDoctorProfile = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      const response = await doctorService.getDoctorById(userId);
      if (response.success && response.data.doctor) {
        setChatStatus(response.data.doctor.isChatOnline || false);
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
    }
  };

  const fetchWeeklyAvailability = async () => {
    try {
      setLoadingWeeklyAvailability(true);
      const userId = sessionStorage.getItem("userId");

      // Get current week's date range (Monday to Sunday)
      const today = new Date();
      const currentDay = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

      const startDate = monday.toISOString().split("T")[0];
      const endDate = new Date(monday);
      endDate.setDate(monday.getDate() + 6);
      const endDateStr = endDate.toISOString().split("T")[0];

      // Fetch slots for the week
      const response = await doctorService.getSlots(
        userId,
        startDate,
        endDateStr
      );

      if (response.success && response.slots) {
        const slotsData = response.slots;

        // Initialize weekly data
        const weekData = [
          { day: "Mon", slots: 0, bookedSlots: 0, status: "free" },
          { day: "Tue", slots: 0, bookedSlots: 0, status: "free" },
          { day: "Wed", slots: 0, bookedSlots: 0, status: "free" },
          { day: "Thu", slots: 0, bookedSlots: 0, status: "free" },
          { day: "Fri", slots: 0, bookedSlots: 0, status: "free" },
          { day: "Sat", slots: 0, bookedSlots: 0, status: "free" },
          { day: "Sun", slots: 0, bookedSlots: 0, status: "free" },
        ];

        // Process each date's slots
        Object.keys(slotsData).forEach((date) => {
          const dateObj = new Date(date);
          const dayIndex = (dateObj.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

          const daySlots = slotsData[date];
          const totalSlots = daySlots.length;
          const bookedSlots = daySlots.filter(
            (slot) => slot.status === "BOOKED" || slot.status === "BLOCKED"
          ).length;

          weekData[dayIndex].slots = totalSlots;
          weekData[dayIndex].bookedSlots = bookedSlots;

          // Determine status based on booking percentage
          if (totalSlots === 0) {
            weekData[dayIndex].status = "free";
          } else {
            const bookingPercentage = (bookedSlots / totalSlots) * 100;
            if (bookingPercentage >= 70) {
              weekData[dayIndex].status = "full";
            } else if (bookingPercentage > 0) {
              weekData[dayIndex].status = "partial";
            } else {
              weekData[dayIndex].status = "available";
            }
          }
        });

        setWeeklyAvailability(weekData);
      }
    } catch (error) {
      console.error("Error fetching weekly availability:", error);
    } finally {
      setLoadingWeeklyAvailability(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const userId = sessionStorage.getItem("userId");
      const today = new Date().toISOString().split("T")[0];

      // Fetch all appointments to calculate metrics
      const allAppointmentsResponse = await doctorService.getAppointments(
        userId
      );

      if (allAppointmentsResponse.success) {
        const allAppointments = allAppointmentsResponse.appointments || [];

        // Count today's appointments (all statuses)
        const todayCount = allAppointments.filter(
          (apt) => apt.appointmentDate === today
        ).length;
        setTodayAppointmentsCount(todayCount);

        // Count completed appointments (today)
        const completedTodayCount = allAppointments.filter(
          (apt) => apt.appointmentDate === today && apt.status === "COMPLETED"
        ).length;
        setCompletedAppointmentsCount(completedTodayCount);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const userId = sessionStorage.getItem("userId");
      const response = await doctorService.getAppointments(userId, "CONFIRMED");

      if (response.success) {
        const allAppointments = response.appointments || [];
        const today = new Date().toISOString().split("T")[0];

        // Filter today's appointments
        const todayAppointments = allAppointments.filter(
          (apt) => apt.appointmentDate === today
        );

        // Sort by start time
        todayAppointments.sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });

        if (todayAppointments.length > 0) {
          setAppointments(todayAppointments);
          setShowingUpcoming(false);
        } else {
          // Show upcoming appointments (next 7 days)
          const upcomingAppointments = allAppointments
            .filter((apt) => apt.appointmentDate > today)
            .sort((a, b) => {
              const dateCompare = a.appointmentDate.localeCompare(
                b.appointmentDate
              );
              if (dateCompare !== 0) return dateCompare;
              return a.startTime.localeCompare(b.startTime);
            })
            .slice(0, 5);

          setAppointments(upcomingAppointments);
          setShowingUpcoming(true);
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // Only show toast if not a silent error (network errors during page load)
      if (!error.silent) {
        toast.error("Failed to load appointments");
      }
    } finally {
      setLoadingAppointments(false);
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

  const handleChatStatusToggle = async () => {
    try {
      setLoadingChatStatus(true);
      const userId = sessionStorage.getItem("userId");
      const newStatus = !chatStatus;

      const response = await doctorService.updateDoctorBasicProfile(userId, {
        isChatOnline: newStatus,
      });

      if (response.success) {
        setChatStatus(newStatus);
      }
    } catch (error) {
      console.error("Error updating chat status:", error);
      toast.error(
        error.errors?.[0]?.message ||
          "Failed to update chat status. Please try again."
      );
    } finally {
      setLoadingChatStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "text-gold-400 bg-gold-500/10 border-gold-500/20";
      case "CONFIRMED":
        return "text-secondary-400 bg-secondary-500/10 border-secondary-500/20";
      case "COMPLETED":
        return "text-primary-400 bg-primary-500/10 border-primary-500/20";
      case "CANCELLED":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case "full":
        return "bg-red-500";
      case "partial":
        return "bg-gold-500";
      case "available":
        return "bg-secondary-500";
      case "free":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Enhanced Navbar */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="bg-secondary-500/10 border border-secondary-500/20 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-secondary-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-100">Dashboard</h1>
            </div>

            {/* Right: Profile, Logout */}
            <div className="flex items-center space-x-4">
              {/* Profile Icon Button */}
              <button
                onClick={() => navigate("/doctor/profile")}
                className="p-2 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                title="View Profile"
              >
                <div className="w-8 h-8 bg-secondary-500/20 border border-secondary-500/30 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-secondary-400" />
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
                Welcome back, Dr. {userName} 🩺
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                You have {appointments.length} appointments{" "}
                {showingUpcoming ? "upcoming" : "today"}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Appointments Today */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 hover:shadow-xl hover:shadow-secondary-500/10 transition-all animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              {loadingMetrics ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-400"></div>
              ) : (
                <span className="text-2xl font-bold text-gray-100">
                  {todayAppointmentsCount}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Appointments</p>
            <p className="text-xs text-gray-500">Today</p>
          </div>

          {/* Completed */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 hover:shadow-xl hover:shadow-secondary-500/10 transition-all animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-secondary-400" />
              {loadingMetrics ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary-400"></div>
              ) : (
                <span className="text-2xl font-bold text-gray-100">
                  {completedAppointmentsCount}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-xs text-gray-500">Today</p>
          </div>

          {/* Weekly Availability */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 hover:shadow-xl hover:shadow-secondary-500/10 transition-all animate-fade-in">
            <p className="text-xs text-gray-400 mb-2">Week Availability</p>
            {loadingWeeklyAvailability ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary-400"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end space-x-1 h-16">
                  {weeklyAvailability.map((day) => {
                    const maxSlots = Math.max(
                      ...weeklyAvailability.map((d) => d.slots),
                      10
                    );
                    const height =
                      day.slots > 0
                        ? Math.max((day.slots / maxSlots) * 56, 8)
                        : 8;
                    return (
                      <div
                        key={day.day}
                        className="flex flex-col items-center flex-1 group relative"
                      >
                        <div
                          className={`w-full ${getAvailabilityColor(
                            day.status
                          )} rounded-t transition-all`}
                          style={{ height: `${height}px` }}
                          title={`${day.day}: ${day.bookedSlots}/${day.slots} booked`}
                        ></div>
                        <span className="text-[10px] text-gray-500 mt-1">
                          {day.day[0]}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                          {day.slots > 0
                            ? `${day.bookedSlots}/${day.slots}`
                            : "No slots"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center space-x-2 mt-2 text-[10px]">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded mr-1"></span>
                    Full
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gold-500 rounded mr-1"></span>
                    Partial
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-secondary-500 rounded mr-1"></span>
                    Available
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded mr-1"></span>
                    Free
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Today's Schedule Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-100 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-secondary-400" />
              {showingUpcoming ? "UPCOMING APPOINTMENTS" : "TODAY'S SCHEDULE"}
            </h3>
            <button
              onClick={() => navigate("/doctor/appointments")}
              className="text-sm text-secondary-400 hover:text-secondary-300 flex items-center space-x-1"
            >
              <span>View All Appointments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {showingUpcoming && (
            <div className="mb-4 bg-gold-500/10 border border-gold-500/20 rounded-lg p-3">
              <p className="text-sm text-gold-300 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                No appointments today. Showing upcoming appointments.
              </p>
            </div>
          )}

          {/* Appointments Table */}
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-400"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No appointments scheduled</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-xs font-medium text-gray-400 pb-3 px-2">
                      {showingUpcoming ? "DATE" : "TIME"}
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-3 px-2">
                      PATIENT
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-3 px-2">
                      REASON
                    </th>
                    <th className="text-right text-xs font-medium text-gray-400 pb-3 px-2">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, index) => (
                    <tr
                      key={appointment.id}
                      className={`${
                        index !== appointments.length - 1
                          ? "border-b border-gray-700/50"
                          : ""
                      } hover:bg-gray-700/30 transition-colors`}
                    >
                      <td className="py-4 px-2">
                        {showingUpcoming ? (
                          <>
                            <p className="text-sm font-semibold text-gray-100">
                              {formatDate(appointment.appointmentDate)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(appointment.startTime)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-gray-100">
                            {formatTime(appointment.startTime)} -{" "}
                            {formatTime(appointment.endTime)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <p className="text-sm font-medium text-gray-100">
                          {appointment.patientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.patientPhone}
                        </p>
                      </td>
                      <td className="py-4 px-2">
                        <p className="text-sm text-gray-300">
                          {appointment.reason}
                        </p>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              navigate(`/doctor/appointments/${appointment.id}`)
                            }
                            className="px-3 py-2 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-lg hover:bg-secondary-500/20 transition-colors flex items-center space-x-1 text-sm"
                          >
                            <Play className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <span
                            className={`px-2 py-1 text-xs rounded border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate("/doctor/schedule")}
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-secondary-500/20 hover:border-secondary-500/30 transition-all text-left group"
          >
            <div className="bg-primary-500/10 border border-primary-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-500/20 transition-colors">
              <Calendar className="w-6 h-6 text-primary-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-100 mb-1">
              Manage Schedule
            </h4>
          </button>

          <button
            onClick={() => navigate("/doctor/leave")}
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-secondary-500/20 hover:border-secondary-500/30 transition-all text-left group relative"
          >
            <div className="bg-gold-500/10 border border-gold-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gold-500/20 transition-colors">
              <Clock className="w-6 h-6 text-gold-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-100 mb-1">
              Apply Leave
            </h4>
          </button>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
