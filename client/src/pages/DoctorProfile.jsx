import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Edit,
  Save,
  X,
  ArrowLeft,
  Mail,
  Phone,
  Award,
  Briefcase,
  DollarSign,
  Clock,
  UserCircle,
  Stethoscope,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { toast } from "react-toastify";
import { doctorService, specializationService } from "../services/api";

const DoctorProfile = () => {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specializations, setSpecializations] = useState([]);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    specializationId: "",
    specializationName: "",
    qualification: "",
    experienceYears: 0,
    consultationFee: 0,
    isChatOnline: false,
    status: "",
    availableSlots: [],
  });

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    specializationId: "",
    qualification: "",
    experienceYears: 0,
    consultationFee: 0,
    isChatOnline: false,
  });

  const daysOfWeek = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 0, label: "Sunday" },
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

    // Fetch profile data and specializations
    fetchProfile();
    fetchSpecializations();
  }, [navigate]);

  const fetchSpecializations = async () => {
    try {
      const response = await specializationService.getActive();
      if (response.success) {
        setSpecializations(response.data.specializations);
      }
    } catch (error) {
      console.error("Error fetching specializations:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId");
      const response = await doctorService.getDoctorById(userId);

      if (response.success) {
        const doctor = response.data.doctor;
        const profileInfo = {
          fullName: doctor.fullName || "",
          email: doctor.email || "",
          phone: doctor.phone || "",
          specializationId: doctor.specializationId || "",
          specializationName: doctor.specialization?.name || "",
          qualification: doctor.qualification || "",
          experienceYears: doctor.experienceYears || 0,
          consultationFee: doctor.consultationFee || 0,
          isChatOnline: doctor.isChatOnline || false,
          status: doctor.status || "",
          availableSlots: doctor.availableSlots || [],
        };
        setProfileData(profileInfo);
        setFormData({
          fullName: profileInfo.fullName,
          phone: profileInfo.phone,
          specializationId: profileInfo.specializationId,
          qualification: profileInfo.qualification,
          experienceYears: profileInfo.experienceYears,
          consultationFee: profileInfo.consultationFee,
          isChatOnline: profileInfo.isChatOnline,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(
        error.errors?.[0]?.message ||
          "Failed to load profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!formData.specializationId) {
      toast.error("Specialization is required");
      return;
    }
    if (!formData.qualification.trim()) {
      toast.error("Qualification is required");
      return;
    }
    if (formData.experienceYears < 0) {
      toast.error("Experience years cannot be negative");
      return;
    }
    if (formData.consultationFee < 0) {
      toast.error("Consultation fee cannot be negative");
      return;
    }

    try {
      setSaving(true);
      const response = await doctorService.updateProfile(formData);

      if (response.success) {
        toast.success(response.message || "Profile updated successfully");
        const doctor = response.data.doctor;
        const updatedProfile = {
          fullName: doctor.fullName || "",
          email: doctor.email || "",
          phone: doctor.phone || "",
          specializationId: doctor.specializationId || "",
          specializationName: doctor.specialization?.name || "",
          qualification: doctor.qualification || "",
          experienceYears: doctor.experienceYears || 0,
          consultationFee: doctor.consultationFee || 0,
          isChatOnline: doctor.isChatOnline || false,
          status: doctor.status || "",
          availableSlots: doctor.availableSlots || [],
        };
        setProfileData(updatedProfile);
        setIsEditMode(false);

        // Update sessionStorage name
        sessionStorage.setItem("userName", doctor.fullName);
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      // Handle specific error cases
      if (error.errors && error.errors.length > 0) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profileData.fullName,
      phone: profileData.phone,
      specializationId: profileData.specializationId,
      qualification: profileData.qualification,
      experienceYears: profileData.experienceYears,
      consultationFee: profileData.consultationFee,
      isChatOnline: profileData.isChatOnline,
    });
    setIsEditMode(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userId");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleBackToDashboard = () => {
    navigate("/doctor/dashboard");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: {
        color: "text-secondary-400 bg-secondary-500/10 border-secondary-500/20",
        icon: "✓",
        label: "Approved",
      },
      PENDING: {
        color: "text-gold-400 bg-gold-500/10 border-gold-500/20",
        icon: "⏳",
        label: "Pending",
      },
      REJECTED: {
        color: "text-red-400 bg-red-500/10 border-red-500/20",
        icon: "✗",
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
      >
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToDashboard}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">My Profile</h1>
                <p className="text-sm text-gray-400">
                  View and manage your profile information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                className="p-2 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-lg transition-colors"
                title="Profile"
              >
                <User className="w-5 h-5" />
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-secondary-600 to-teal-600 border-b border-secondary-500/30 px-8 py-12 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                  <Stethoscope className="w-16 h-16" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    {profileData.fullName || "Your Name"}
                  </h2>
                  <p className="text-emerald-100 mt-1">{profileData.email}</p>
                  <div className="mt-2">
                    {getStatusBadge(profileData.status)}
                  </div>
                </div>
              </div>
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-800 border border-gray-600 text-secondary-400 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-8 py-8">
            {isEditMode ? (
              // Edit Mode
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-not-allowed text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                    placeholder="+911234567890"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="specializationId"
                    value={formData.specializationId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                  >
                    <option value="">Select specialization</option>
                    {specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Qualification <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                    placeholder="MBBS, MD, etc."
                  />
                </div>

                {/* Experience Years */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Experience (Years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                    placeholder="0"
                  />
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Consultation Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                    placeholder="0"
                  />
                </div>


                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 shadow-lg shadow-secondary-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 border border-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-secondary-500/10 border border-secondary-500/20 p-2 rounded-lg mt-1">
                      <User className="w-5 h-5 text-secondary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Full Name</p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.fullName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-lg mt-1">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-gold-500/10 border border-gold-500/20 p-2 rounded-lg mt-1">
                      <Phone className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Phone</p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg mt-1">
                      <Stethoscope className="w-5 h-5 text-accent-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">
                        Specialization
                      </p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.specializationName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Qualification */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary-500/10 border border-primary-500/20 p-2 rounded-lg mt-1">
                      <Award className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">
                        Qualification
                      </p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.qualification || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-secondary-500/10 border border-secondary-500/20 p-2 rounded-lg mt-1">
                      <Briefcase className="w-5 h-5 text-secondary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Experience</p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.experienceYears} years
                      </p>
                    </div>
                  </div>

                  {/* Consultation Fee */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-gold-500/10 border border-gold-500/20 p-2 rounded-lg mt-1">
                      <DollarSign className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">
                        Consultation Fee
                      </p>
                      <p className="text-lg font-semibold text-gray-100">
                        ₹{profileData.consultationFee}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Available Slots */}
                {profileData.availableSlots.length > 0 && (
                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-secondary-400" />
                      Available Slots
                    </h3>
                    <div className="grid gap-3">
                      {profileData.availableSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-secondary-500/10 border border-secondary-500/20 p-2 rounded">
                              <Clock className="w-4 h-4 text-secondary-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-200">
                                {
                                  daysOfWeek.find(
                                    (d) => d.value === slot.dayOfWeek
                                  )?.label
                                }
                              </p>
                              <p className="text-xs text-gray-400">
                                {slot.startTime} - {slot.endTime} (
                                {slot.slotDurationMinutes} min slots)
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfile;
