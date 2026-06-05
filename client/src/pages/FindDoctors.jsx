import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  IndianRupee,
  Clock,
  Stethoscope,
  User,
  MessageSquare,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { doctorService, specializationService } from "../services/api";

const FindDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchDoctorsAndSpecializations();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialization]);

  const fetchDoctorsAndSpecializations = async () => {
    try {
      setIsLoading(true);

      // Fetch approved doctors and active specializations in parallel
      const [doctorsResponse, specializationsResponse] = await Promise.all([
        doctorService.getApprovedDoctors(),
        specializationService.getActive(),
      ]);

      if (doctorsResponse.success) {
        setDoctors(doctorsResponse.data.doctors || []);
      }

      if (specializationsResponse.success) {
        setSpecializations(specializationsResponse.data.specializations || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        error?.errors?.[0]?.message ||
          "Failed to fetch doctors. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Filter by specialization
    if (selectedSpecialization !== "all") {
      filtered = filtered.filter(
        (doctor) => doctor.specializationId === selectedSpecialization
      );
    }

    // Filter by search term (name or qualification)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doctor) =>
          doctor.fullName.toLowerCase().includes(searchLower) ||
          doctor.qualification.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDoctors(filtered);
  };

  const getSpecializationName = (specializationId) => {
    const spec = specializations.find((s) => s.id === specializationId);
    return spec ? spec.name : "General";
  };

  const handleBookAppointment = (doctor) => {
    navigate(`/patient/book-appointment/${doctor.id}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialization("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  Find Doctors
                </h1>
                <p className="text-sm text-gray-400">
                  Browse and book appointments with our specialists
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by doctor name or qualification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Filter by Specialization */}
            <div className="relative md:w-64">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">
                    {selectedSpecialization === "all"
                      ? "All Specializations"
                      : getSpecializationName(selectedSpecialization)}
                  </span>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showFilterDropdown && (
                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-10">
                  <button
                    onClick={() => {
                      setSelectedSpecialization("all");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
                      selectedSpecialization === "all"
                        ? "bg-gray-700 text-primary-400"
                        : "text-gray-300"
                    }`}
                  >
                    All Specializations
                  </button>
                  {specializations.map((spec) => (
                    <button
                      key={spec.id}
                      onClick={() => {
                        setSelectedSpecialization(spec.id);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
                        selectedSpecialization === spec.id
                          ? "bg-gray-700 text-primary-400"
                          : "text-gray-300"
                      }`}
                    >
                      {spec.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || selectedSpecialization !== "all") && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Clear</span>
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {isLoading ? (
                "Loading doctors..."
              ) : (
                <>
                  Showing{" "}
                  <span className="text-primary-400 font-semibold">
                    {filteredDoctors.length}
                  </span>{" "}
                  of <span className="text-gray-300">{doctors.length}</span>{" "}
                  doctors
                </>
              )}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading doctors...</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredDoctors.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              No doctors found
            </h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Doctors Grid */}
        {!isLoading && filteredDoctors.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-500/30 transition-all animate-fade-in"
              >
                {/* Doctor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-14 h-14 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-100">
                        {doctor.fullName}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                        <Stethoscope className="w-4 h-4 text-secondary-400" />
                        <span>
                          {getSpecializationName(doctor.specializationId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Online Status Badge */}
                  {doctor.isChatOnline && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-secondary-500/10 border border-secondary-500/20 rounded-full">
                      <span className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse"></span>
                      <span className="text-xs text-secondary-400">Online</span>
                    </div>
                  )}
                </div>

                {/* Qualification */}
                <div className="mb-4 p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Qualification</p>
                  <p className="text-sm text-gray-300">
                    {doctor.qualification}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center space-x-2 p-2 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                    <Clock className="w-4 h-4 text-gold-400" />
                    <div>
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="text-sm font-semibold text-gray-200">
                        {doctor.experienceYears} years
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-2 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                    <IndianRupee className="w-4 h-4 text-secondary-400" />
                    <div>
                      <p className="text-xs text-gray-500">Fee</p>
                      <p className="text-sm font-semibold text-gray-200">
                        ₹{doctor.consultationFee}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBookAppointment(doctor)}
                    className="flex-1 px-4 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Book Appointment</span>
                  </button>

                  {doctor.isChatOnline && (
                    <button
                      onClick={() => toast.info("Chat feature coming soon")}
                      className="p-2 bg-accent-500/10 border border-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/20 transition-colors"
                      title="Chat with doctor"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Contact Info (on hover) */}
                <div className="mt-3 pt-3 border-t border-gray-700/50 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doctor.email}</span>
                    <span>{doctor.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FindDoctors;
