import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Zap,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RefreshCw,
  LogOut,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { doctorService } from "../services/api";

const ManageSchedule = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState({});
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [showManualCreateModal, setShowManualCreateModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  // Quick Create Form
  const [quickCreateForm, setQuickCreateForm] = useState({
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMinutes: 30,
  });

  // Manual Create Form
  const [manualSlots, setManualSlots] = useState([
    { startTime: "09:00", endTime: "09:30" },
  ]);

  // Recurring Slots Form
  const [recurringForm, setRecurringForm] = useState({
    startDate: "",
    endDate: "",
    daysOfWeek: [],
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMinutes: 30,
  });

  const daysOfWeek = [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
    { value: 0, label: "Sun" },
  ];

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userRole");

    if (!token || role !== "DOCTOR") {
      toast.error("Please login as a doctor");
      navigate("/login");
      return;
    }

    // Fetch slots for current month
    fetchSlots();
  }, [currentDate, navigate]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");
      const startDate = getMonthStartDate(currentDate);
      const endDate = getMonthEndDate(currentDate);

      const response = await doctorService.getSlots(userId, startDate, endDate);
      if (response.success) {
        setSlots(response.slots || {});
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error(error.errors?.[0]?.message || "Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const getMonthStartDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  };

  const getMonthEndDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getSlotCount = (date) => {
    if (!date) return 0;
    const key = formatDateKey(date);
    return slots[key]?.length || 0;
  };

  const getSlotStatusIndicator = (date) => {
    if (!date) return null;
    const key = formatDateKey(date);
    const dateSlots = slots[key] || [];
    if (dateSlots.length === 0) return "○";
    const hasBooked = dateSlots.some((s) => s.status === "BOOKED");
    const hasAvailable = dateSlots.some((s) => s.status === "AVAILABLE");
    if (hasBooked && hasAvailable) return "◐";
    if (hasBooked) return "●";
    return "●";
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedSlots([]);
  };

  const handleSlotToggle = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleSelectAll = () => {
    const key = formatDateKey(selectedDate);
    const dateSlots = slots[key] || [];
    const selectableSlotIds = dateSlots
      .filter((s) => s.status === "AVAILABLE" || s.status === "BLOCKED")
      .map((s) => s.id);

    if (selectedSlots.length === selectableSlotIds.length) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(selectableSlotIds);
    }
  };

  const handleQuickCreate = async () => {
    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      const response = await doctorService.createQuickSlots(
        userId,
        quickCreateForm
      );

      if (response.success) {
        toast.success(response.message || "Slots created successfully!");
        setShowQuickCreateModal(false);
        setQuickCreateForm({
          date: "",
          startTime: "09:00",
          endTime: "17:00",
          slotDurationMinutes: 30,
        });
        fetchSlots();
      }
    } catch (error) {
      console.error("Error creating slots:", error);
      toast.error(error.errors?.[0]?.message || "Failed to create slots");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCreate = async () => {
    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");
      const dateKey = formatDateKey(selectedDate);

      const response = await doctorService.createBulkSlots(userId, {
        date: dateKey,
        slots: manualSlots,
      });

      if (response.success) {
        toast.success(response.message || "Slots created successfully!");
        setShowManualCreateModal(false);
        setManualSlots([{ startTime: "09:00", endTime: "09:30" }]);
        fetchSlots();
      }
    } catch (error) {
      console.error("Error creating slots:", error);
      toast.error(error.errors?.[0]?.message || "Failed to create slots");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSlots.length === 0) {
      toast.warning("Please select slots to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedSlots.length} selected slots?`)) {
      return;
    }

    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      const response = await doctorService.deleteBulkSlots(userId, {
        slotIds: selectedSlots,
      });

      if (response.success) {
        toast.success(response.message || "Slots deleted successfully!");
        setSelectedSlots([]);
        fetchSlots();
      }
    } catch (error) {
      console.error("Error deleting slots:", error);
      toast.error(
        error.message || error.errors?.[0]?.message || "Failed to delete slots"
      );
    } finally {
      setLoading(false);
    }
  };

  const addManualSlot = () => {
    setManualSlots([...manualSlots, { startTime: "09:00", endTime: "09:30" }]);
  };

  const removeManualSlot = (index) => {
    setManualSlots(manualSlots.filter((_, i) => i !== index));
  };

  const updateManualSlot = (index, field, value) => {
    const updated = [...manualSlots];
    updated[index][field] = value;
    setManualSlots(updated);
  };

  const handleBlockSlots = async () => {
    if (selectedSlots.length === 0) {
      toast.warning("Please select slots to block");
      return;
    }

    const reason = window.prompt("Enter reason for blocking slots:");
    if (!reason || !reason.trim()) {
      toast.warning("Reason is required to block slots");
      return;
    }

    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      const response = await doctorService.bulkUpdateSlotStatus(userId, {
        slotIds: selectedSlots,
        status: "BLOCKED",
        reason: reason.trim(),
      });

      if (response.success) {
        toast.success(response.message || "Slots blocked successfully!");
        setSelectedSlots([]);
        fetchSlots();
      }
    } catch (error) {
      console.error("Error blocking slots:", error);
      toast.error(
        error.message || error.errors?.[0]?.message || "Failed to block slots"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockSlots = async () => {
    if (selectedSlots.length === 0) {
      toast.warning("Please select slots to unblock");
      return;
    }

    if (
      !window.confirm(
        `Unblock ${selectedSlots.length} selected slots and make them available?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      const response = await doctorService.bulkUpdateSlotStatus(userId, {
        slotIds: selectedSlots,
        status: "AVAILABLE",
      });

      if (response.success) {
        toast.success(response.message || "Slots unblocked successfully!");
        setSelectedSlots([]);
        fetchSlots();
      }
    } catch (error) {
      console.error("Error unblocking slots:", error);
      toast.error(
        error.message || error.errors?.[0]?.message || "Failed to unblock slots"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecurringCreate = async () => {
    if (!recurringForm.startDate || !recurringForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    if (recurringForm.daysOfWeek.length === 0) {
      toast.error("Please select at least one day of the week");
      return;
    }

    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");

      // Calculate all dates that match the selected days of week
      const dates = [];
      const start = new Date(recurringForm.startDate);
      const end = new Date(recurringForm.endDate);

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        if (recurringForm.daysOfWeek.includes(date.getDay())) {
          dates.push(formatDateKey(new Date(date)));
        }
      }

      if (dates.length === 0) {
        toast.error("No dates match the selected days of week in this range");
        setLoading(false);
        return;
      }

      // Create slots for each date using quick-create API
      let successCount = 0;
      let failCount = 0;

      for (const date of dates) {
        try {
          await doctorService.createQuickSlots(userId, {
            date: date,
            startTime: recurringForm.startTime,
            endTime: recurringForm.endTime,
            slotDurationMinutes: recurringForm.slotDurationMinutes,
          });
          successCount++;
        } catch (error) {
          console.error(`Error creating slots for ${date}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Created slots for ${successCount} day(s)${
            failCount > 0 ? `, failed for ${failCount} day(s)` : ""
          }`
        );
        setShowRecurringModal(false);
        setRecurringForm({
          startDate: "",
          endDate: "",
          daysOfWeek: [],
          startTime: "09:00",
          endTime: "17:00",
          slotDurationMinutes: 30,
        });
        fetchSlots();
      } else {
        toast.error("Failed to create recurring slots");
      }
    } catch (error) {
      console.error("Error creating recurring slots:", error);
      toast.error("Failed to create recurring slots");
    } finally {
      setLoading(false);
    }
  };

  const toggleDayOfWeek = (day) => {
    setRecurringForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-secondary-500/10 border-secondary-500/30 text-secondary-400";
      case "BOOKED":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "BLOCKED":
        return "bg-gray-500/10 border-gray-500/30 text-gray-400";
      default:
        return "bg-gray-500/10 border-gray-500/30 text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "🟢";
      case "BOOKED":
        return "🔴";
      case "BLOCKED":
        return "⚫";
      default:
        return "⚪";
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

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDateSlots = slots[selectedDateKey] || [];

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
                  Manage Schedule
                </h1>
                <p className="text-sm text-gray-400">
                  Create and manage your appointment slots
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
        {/* Calendar Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-100 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-secondary-400" />
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-300" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
              <button
                onClick={fetchSlots}
                className="p-2 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 hover:bg-secondary-500/20 rounded-lg transition-colors ml-2"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
            {getDaysInMonth().map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-2"></div>;
              }

              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              const slotCount = getSlotCount(date);
              const isPast = date < new Date().setHours(0, 0, 0, 0);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  disabled={isPast}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    isSelected
                      ? "bg-secondary-500/20 border-secondary-500/50 ring-2 ring-secondary-500/30"
                      : isToday
                      ? "bg-primary-500/10 border-primary-500/30"
                      : isPast
                      ? "bg-gray-900/30 border-gray-700/30 opacity-50 cursor-not-allowed"
                      : "bg-gray-900/50 border-gray-700 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-100">
                    {date.getDate()}
                  </div>
                  {slotCount > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {slotCount} slots
                    </div>
                  )}
                  <div className="text-sm mt-1">
                    {getSlotStatusIndicator(date)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-700">
            <span className="text-sm text-gray-400 flex items-center">
              <span className="mr-2">●</span> Has Slots
            </span>
            <span className="text-sm text-gray-400 flex items-center">
              <span className="mr-2">◐</span> Partially Booked
            </span>
            <span className="text-sm text-gray-400 flex items-center">
              <span className="mr-2">○</span> No Slots
            </span>
          </div>
        </div>

        {/* Slots Management Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Slot List */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-100">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              {selectedDateSlots.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-secondary-400 hover:text-secondary-300"
                  >
                    {selectedSlots.length ===
                      selectedDateSlots.filter(
                        (s) =>
                          s.status === "AVAILABLE" || s.status === "BLOCKED"
                      ).length && selectedSlots.length > 0
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  {selectedSlots.length > 0 && (
                    <>
                      <button
                        onClick={handleBlockSlots}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/20 transition-colors text-sm"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Block ({selectedSlots.length})</span>
                      </button>
                      <button
                        onClick={handleUnblockSlots}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-lg hover:bg-secondary-500/20 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>Unblock ({selectedSlots.length})</span>
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete ({selectedSlots.length})</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Slots List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedDateSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No slots for this date</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Use quick create or add manual slots to get started
                  </p>
                </div>
              ) : (
                selectedDateSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedSlots.includes(slot.id)
                        ? "bg-secondary-500/10 border-secondary-500/30"
                        : "bg-gray-900/50 border-gray-700"
                    } transition-all`}
                  >
                    <div className="flex items-center space-x-3">
                      {(slot.status === "AVAILABLE" ||
                        slot.status === "BLOCKED") && (
                        <input
                          type="checkbox"
                          checked={selectedSlots.includes(slot.id)}
                          onChange={() => handleSlotToggle(slot.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-secondary-500 focus:ring-2 focus:ring-secondary-500"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-100">
                          {slot.startTime} - {slot.endTime}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(
                              slot.status
                            )}`}
                          >
                            {getStatusIcon(slot.status)} {slot.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="space-y-4">
            {/* Quick Create */}
            <button
              onClick={() => {
                setQuickCreateForm({
                  ...quickCreateForm,
                  date: formatDateKey(selectedDate),
                });
                setShowQuickCreateModal(true);
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-secondary-500/20 hover:border-secondary-500/30 transition-all text-left group"
            >
              <div className="bg-secondary-500/10 border border-secondary-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-secondary-500/20 transition-colors">
                <Zap className="w-6 h-6 text-secondary-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-100 mb-1">
                Quick Create
              </h4>
              <p className="text-xs text-gray-400">
                Generate slots by time range
              </p>
            </button>

            {/* Manual Create */}
            <button
              onClick={() => setShowManualCreateModal(true)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-primary-500/20 hover:border-primary-500/30 transition-all text-left group"
            >
              <div className="bg-primary-500/10 border border-primary-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-500/20 transition-colors">
                <Plus className="w-6 h-6 text-primary-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-100 mb-1">
                Add Manual Slots
              </h4>
              <p className="text-xs text-gray-400">Create custom time slots</p>
            </button>

            {/* Recurring Slots */}
            <button
              onClick={() => setShowRecurringModal(true)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-accent-500/20 hover:border-accent-500/30 transition-all text-left group"
            >
              <div className="bg-accent-500/10 border border-accent-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent-500/20 transition-colors">
                <RefreshCw className="w-6 h-6 text-accent-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-100 mb-1">
                Recurring Slots
              </h4>
              <p className="text-xs text-gray-400">
                Create slots for multiple days
              </p>
            </button>
          </div>
        </div>
      </main>

      {/* Quick Create Modal */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-secondary-400" />
                Quick Create Slots
              </h3>
              <button
                onClick={() => setShowQuickCreateModal(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={quickCreateForm.date}
                  onChange={(e) =>
                    setQuickCreateForm({
                      ...quickCreateForm,
                      date: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={quickCreateForm.startTime}
                    onChange={(e) =>
                      setQuickCreateForm({
                        ...quickCreateForm,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={quickCreateForm.endTime}
                    onChange={(e) =>
                      setQuickCreateForm({
                        ...quickCreateForm,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slot Duration (minutes)
                </label>
                <select
                  value={quickCreateForm.slotDurationMinutes}
                  onChange={(e) =>
                    setQuickCreateForm({
                      ...quickCreateForm,
                      slotDurationMinutes: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              {/* Preview */}
              <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-secondary-400">
                    Preview:
                  </span>{" "}
                  This will create approximately{" "}
                  {Math.floor(
                    (parseInt(quickCreateForm.endTime.split(":")[0]) * 60 +
                      parseInt(quickCreateForm.endTime.split(":")[1]) -
                      (parseInt(quickCreateForm.startTime.split(":")[0]) * 60 +
                        parseInt(quickCreateForm.startTime.split(":")[1]))) /
                      quickCreateForm.slotDurationMinutes
                  )}{" "}
                  slots
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleQuickCreate}
                disabled={loading}
                className="flex-1 bg-secondary-600 text-white py-2.5 rounded-lg hover:bg-secondary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Slots"}
              </button>
              <button
                onClick={() => setShowQuickCreateModal(false)}
                className="px-6 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {showManualCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary-400" />
                Add Manual Slots
              </h3>
              <button
                onClick={() => setShowManualCreateModal(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date: {selectedDate.toLocaleDateString()}
              </label>
            </div>

            <div className="space-y-3 mb-6">
              {manualSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 bg-gray-900/50 p-3 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-400 w-16">
                    Slot {index + 1}
                  </span>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) =>
                      updateManualSlot(index, "startTime", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) =>
                      updateManualSlot(index, "endTime", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {manualSlots.length > 1 && (
                    <button
                      onClick={() => removeManualSlot(index)}
                      className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addManualSlot}
              className="w-full py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium mb-6 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Slot</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleManualCreate}
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Creating..."
                  : `Create ${manualSlots.length} Slot${
                      manualSlots.length > 1 ? "s" : ""
                    }`}
              </button>
              <button
                onClick={() => setShowManualCreateModal(false)}
                className="px-6 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Slots Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100 flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-accent-400" />
                Create Recurring Slots
              </h3>
              <button
                onClick={() => setShowRecurringModal(false)}
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
                    value={recurringForm.startDate}
                    onChange={(e) =>
                      setRecurringForm({
                        ...recurringForm,
                        startDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={recurringForm.endDate}
                    onChange={(e) =>
                      setRecurringForm({
                        ...recurringForm,
                        endDate: e.target.value,
                      })
                    }
                    min={
                      recurringForm.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        recurringForm.daysOfWeek.includes(day.value)
                          ? "bg-accent-500/20 border-accent-500/50 text-accent-300"
                          : "bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={recurringForm.startTime}
                    onChange={(e) =>
                      setRecurringForm({
                        ...recurringForm,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={recurringForm.endTime}
                    onChange={(e) =>
                      setRecurringForm({
                        ...recurringForm,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>
              </div>

              {/* Slot Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slot Duration (minutes)
                </label>
                <select
                  value={recurringForm.slotDurationMinutes}
                  onChange={(e) =>
                    setRecurringForm({
                      ...recurringForm,
                      slotDurationMinutes: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              {/* Preview */}
              {recurringForm.startDate &&
                recurringForm.endDate &&
                recurringForm.daysOfWeek.length > 0 && (
                  <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-4">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-accent-400">
                        Preview:
                      </span>{" "}
                      This will create slots for{" "}
                      {recurringForm.daysOfWeek
                        .map(
                          (d) =>
                            daysOfWeek.find((day) => day.value === d)?.label
                        )
                        .join(", ")}{" "}
                      from{" "}
                      {new Date(recurringForm.startDate).toLocaleDateString()}{" "}
                      to {new Date(recurringForm.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleRecurringCreate}
                disabled={loading}
                className="flex-1 bg-accent-600 text-white py-2.5 rounded-lg hover:bg-accent-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Recurring Slots"}
              </button>
              <button
                onClick={() => setShowRecurringModal(false)}
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

export default ManageSchedule;
