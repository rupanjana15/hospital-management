import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Users, Calendar, Shield, Activity, Clock } from "lucide-react";
import { adminService } from "../services/api";

const LandingPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getDashboardStats();
        if (response.success) {
          setStats({
            doctors: response.data.doctors.approved || 0,
            patients: response.data.totalPatients || 0,
            appointments: response.data.appointments.total || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Navigation Bar */}
      <nav className="bg-gray-800/90 backdrop-blur-md shadow-2xl border-b border-gray-700 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-500/20">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-100">
                MediCare Plus
              </span>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="text-primary-400 hover:text-primary-300 font-medium px-4 py-2 rounded-lg hover:bg-primary-500/10 border border-primary-500/20 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-fade-in">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-100 leading-tight mb-6">
                Your Health,
                <span className="text-primary-400"> Our Priority</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Experience seamless healthcare management with MediCare Plus.
                Connect with top doctors, schedule appointments, and manage your
                health records—all in one place.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => navigate("/register/patient")}
                  className="group bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>Register as Patient</span>
                </button>
                <button
                  onClick={() => navigate("/register/doctor")}
                  className="group bg-gray-800 text-secondary-400 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-secondary-500/20 hover:shadow-secondary-500/30 border-2 border-secondary-500 flex items-center justify-center space-x-2"
                >
                  <Activity className="w-5 h-5" />
                  <span>Register as Doctor</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-400">
                    {loading ? "..." : stats.doctors}
                  </div>
                  <div className="text-sm text-gray-400">Doctors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-400">
                    {loading ? "..." : stats.patients}
                  </div>
                  <div className="text-sm text-gray-400">Patients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-400">
                    {loading ? "..." : stats.appointments}
                  </div>
                  <div className="text-sm text-gray-400">Appointments</div>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Cards */}
            <div className="relative animate-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Feature Card 1 */}
                <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="bg-primary-500/10 border border-primary-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Easy Scheduling
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Book appointments with top doctors in just a few clicks
                  </p>
                </div>

                {/* Feature Card 2 */}
                <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-lg shadow-secondary-500/10 hover:shadow-secondary-500/20 transition-all duration-300 transform hover:-translate-y-2 sm:mt-8">
                  <div className="bg-secondary-500/10 border border-secondary-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Secure Records
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Your medical records are encrypted and safely stored
                  </p>
                </div>

                {/* Feature Card 3 */}
                <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-lg shadow-accent-500/10 hover:shadow-accent-500/20 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="bg-accent-500/10 border border-accent-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-accent-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Expert Doctors
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Connect with verified specialists across all fields
                  </p>
                </div>

                {/* Feature Card 4 */}
                <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 transition-all duration-300 transform hover:-translate-y-2 sm:mt-8">
                  <div className="bg-gold-500/10 border border-gold-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-gold-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    24/7 Support
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Round-the-clock assistance for all your healthcare needs
                  </p>
                </div>
              </div>

              {/* Floating Element */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-500/20 rounded-full blur-3xl opacity-50 animate-float"></div>
              <div
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary-500/20 rounded-full blur-3xl opacity-50 animate-float"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges Section */}
      <div className="bg-gray-800 border-y border-gray-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-100">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-gray-400 mt-2">
              Join thousands of doctors and patients using MediCare Plus
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            <div className="text-center">
              <div className="text-4xl mb-2">🏥</div>
              <p className="text-sm font-medium text-gray-300">
                Multi-Specialty
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <p className="text-sm font-medium text-gray-300">
                Secure & Private
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <p className="text-sm font-medium text-gray-300">
                Fast & Reliable
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💙</div>
              <p className="text-sm font-medium text-gray-300">Patient First</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-500/20">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">MediCare Plus</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 MediCare Plus. Empowering healthcare, one click at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
