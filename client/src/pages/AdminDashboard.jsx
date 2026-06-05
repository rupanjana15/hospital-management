import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Shield,
  Users,
  UserCheck,
  Stethoscope,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  Activity,
} from "lucide-react";
import { toast } from "react-toastify";
import DoctorKanbanBoard from "../components/DoctorKanbanBoard";
import SpecializationManagement from "./SpecializationManagement";
import PatientManagement from "./PatientManagement";
import { adminService, doctorService } from "../services/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: "",
    id: "",
  });
  const [activeView, setActiveView] = useState("dashboard"); // 'dashboard', 'doctors', 'specializations', or 'patients'
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    appointmentsToday: 0,
    pendingApprovals: 0,
  });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from sessionStorage
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userRole");
    const name = sessionStorage.getItem("userName");
    const id = sessionStorage.getItem("userId");

    if (!token || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      toast.error("Please login as an admin");
      navigate("/login");
      return;
    }

    setUserInfo({ name, role, id });
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard statistics
      const statsResponse = await adminService.getDashboardStats();
      if (statsResponse.success) {
        const { doctors, totalPatients, appointments } = statsResponse.data;
        setStats({
          totalPatients: totalPatients,
          totalDoctors: doctors.approved,
          appointmentsToday: appointments.today,
          pendingApprovals: doctors.pending,
        });
      }

      // Fetch all doctors to get pending ones
      const doctorsResponse = await doctorService.getAllDoctors();
      if (doctorsResponse.success) {
        const pending = doctorsResponse.data.doctors.filter(
          (doctor) => doctor.status === "PENDING"
        );
        setPendingDoctors(pending);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Don't show toast for silent errors (network errors during page refresh)
      if (!error.silent) {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
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

  const getActionColor = (color) => {
    const colors = {
      red: "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20",
      gold: "bg-gold-500/10 border-gold-500/20 text-gold-400 hover:bg-gold-500/20",
      green:
        "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20",
    };
    return colors[color] || colors.gold;
  };

  // If viewing doctor kanban, show that instead
  if (activeView === "doctors") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                  <Shield className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-100">
                    Admin Panel
                  </h1>
                  <p className="text-sm text-gray-400">Doctor Management</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DoctorKanbanBoard onBack={() => setActiveView("dashboard")} />
        </main>
      </div>
    );
  }

  // If viewing specialization management, show that instead
  if (activeView === "specializations") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                  <Shield className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-100">
                    Admin Panel
                  </h1>
                  <p className="text-sm text-gray-400">
                    Specialization Management
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SpecializationManagement onBack={() => setActiveView("dashboard")} />
        </main>
      </div>
    );
  }

  // If viewing patient management, show that instead
  if (activeView === "patients") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                  <Shield className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-100">
                    Admin Panel
                  </h1>
                  <p className="text-sm text-gray-400">Patient Management</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PatientManagement onBack={() => setActiveView("dashboard")} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-400">
                  Welcome back, {userInfo.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-100 mb-2">
            Dashboard Overview
          </h2>
          <p className="text-gray-400">
            Monitor and manage your hospital management system
          </p>
        </div>

        {/* Quick Glance Stats */}
        <div className="mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-accent-400" />
            Quick Glance
          </h3>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat Card 1 - Patients */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-primary-500/10 p-6 hover:shadow-primary-500/20 transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                    <Users className="w-6 h-6 text-primary-400" />
                  </div>
                </div>
                <h4 className="text-3xl font-bold text-gray-100 mb-1">
                  {stats.totalPatients}
                </h4>
                <p className="text-sm text-gray-400">Total Patients</p>
                <p className="text-xs text-gray-500 mt-2">
                  Active users in system
                </p>
              </div>

              {/* Stat Card 2 - Doctors */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-secondary-500/10 p-6 hover:shadow-secondary-500/20 transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-secondary-500/10 border border-secondary-500/20 p-3 rounded-lg group-hover:bg-secondary-500/20 transition-colors">
                    <Stethoscope className="w-6 h-6 text-secondary-400" />
                  </div>
                </div>
                <h4 className="text-3xl font-bold text-gray-100 mb-1">
                  {stats.totalDoctors}
                </h4>
                <p className="text-sm text-gray-400">Total Doctors</p>
                <p className="text-xs text-gray-500 mt-2">
                  Approved physicians
                </p>
              </div>

              {/* Stat Card 3 - Appointments */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-accent-500/10 p-6 hover:shadow-accent-500/20 transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-accent-500/10 border border-accent-500/20 p-3 rounded-lg group-hover:bg-accent-500/20 transition-colors">
                    <Calendar className="w-6 h-6 text-accent-400" />
                  </div>
                  <span className="text-xs font-medium text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-1 rounded-full">
                    Today
                  </span>
                </div>
                <h4 className="text-3xl font-bold text-gray-100 mb-1">
                  {stats.appointmentsToday}
                </h4>
                <p className="text-sm text-gray-400">Appointments</p>
                <p className="text-xs text-gray-500 mt-2">
                  Scheduled for today
                </p>
              </div>

              {/* Stat Card 4 - Pending Approvals */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-gold-500/10 p-6 hover:shadow-gold-500/20 transition-all hover:scale-105 cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gold-500/10 border border-gold-500/20 p-3 rounded-lg group-hover:bg-gold-500/20 transition-colors">
                    <Clock className="w-6 h-6 text-gold-400" />
                  </div>
                  <span className="text-xs font-medium text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
                <h4 className="text-3xl font-bold text-gray-100 mb-1">
                  {stats.pendingApprovals}
                </h4>
                <p className="text-sm text-gray-400">Pending Actions</p>
                <p className="text-xs text-gray-500 mt-2">
                  Require your attention
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Priority Actions */}
        <div className="mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-accent-400" />
            Priority Actions
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
              </div>
            ) : pendingDoctors.length > 0 ? (
              <div
                onClick={() => setActiveView("doctors")}
                className="bg-gray-800 border border-red-500/20 rounded-xl shadow-lg p-5 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-1">
                        {pendingDoctors.length} Doctor Approval
                        {pendingDoctors.length !== 1 ? "s" : ""} Pending
                      </h4>
                      <p className="text-sm text-gray-400 mb-2">
                        New doctor registrations awaiting verification
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg shadow-lg shadow-accent-500/30 transition-all group-hover:shadow-accent-500/50">
                    <span className="text-sm font-medium">Review Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-5">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-100 mb-1">
                      All Caught Up!
                    </h4>
                    <p className="text-sm text-gray-400">
                      No pending doctor approvals at this time
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Management Sections Grid */}
        <div className="mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-accent-400" />
            Management Sections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Patients Management */}
            <div
              onClick={() => setActiveView("patients")}
              className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-primary-500/10 p-6 hover:shadow-primary-500/20 transition-all hover:scale-105 cursor-pointer group"
            >
              <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-lg inline-block mb-4 group-hover:bg-primary-500/20 transition-colors">
                <Users className="w-8 h-8 text-primary-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-100 mb-2">Patients</h4>
              <p className="text-sm text-gray-400 mb-4">
                Manage patient records, profiles, and medical history
              </p>
              <button className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors group-hover:translate-x-2">
                <span className="text-sm font-medium">Manage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Doctors Management */}
            <div
              onClick={() => setActiveView("doctors")}
              className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-secondary-500/10 p-6 hover:shadow-secondary-500/20 transition-all hover:scale-105 cursor-pointer group"
            >
              <div className="bg-secondary-500/10 border border-secondary-500/20 p-4 rounded-lg inline-block mb-4 group-hover:bg-secondary-500/20 transition-colors">
                <Stethoscope className="w-8 h-8 text-secondary-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-100 mb-2">Doctors</h4>
              <p className="text-sm text-gray-400 mb-4">
                Approve registrations, manage profiles and specializations
              </p>
              <button className="flex items-center space-x-2 text-secondary-400 hover:text-secondary-300 transition-colors group-hover:translate-x-2">
                <span className="text-sm font-medium">Manage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Specializations */}
            <div
              onClick={() => setActiveView("specializations")}
              className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-accent-500/10 p-6 hover:shadow-accent-500/20 transition-all hover:scale-105 cursor-pointer group"
            >
              <div className="bg-accent-500/10 border border-accent-500/20 p-4 rounded-lg inline-block mb-4 group-hover:bg-accent-500/20 transition-colors">
                <UserCheck className="w-8 h-8 text-accent-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-100 mb-2">
                Specializations
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Manage medical specializations and categories
              </p>
              <button className="flex items-center space-x-2 text-accent-400 hover:text-accent-300 transition-colors group-hover:translate-x-2">
                <span className="text-sm font-medium">Manage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity
        <div className="animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-accent-400" />
            Recent Activity
          </h3>
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6">
            <div className="space-y-4">
              {mockRecentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`flex items-start space-x-4 pb-4 ${
                      index !== mockRecentActivity.length - 1
                        ? "border-b border-gray-700"
                        : ""
                    }`}
                  >
                    <div
                      className={`${getActivityColor(
                        activity.color
                      )} p-2 rounded-lg`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.type} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 border border-gray-600 text-gray-300 rounded-lg hover:border-accent-500/50 hover:bg-gray-900/50 transition-colors">
              <span className="text-sm font-medium">View All Activity</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div> */}
      </main>
    </div>
  );
};

export default AdminDashboard;
