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
  Calendar,
  MapPin,
  Droplet,
  UserCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { patientService } from "../services/api";

const PatientProfile = () => {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
  });

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userRole");

    if (!token || role !== "PATIENT") {
      toast.error("Please login as a patient");
      navigate("/login");
      return;
    }

    // Fetch profile data
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await patientService.getProfile();

      if (response.success) {
        const patient = response.data.patient;
        const profileInfo = {
          fullName: patient.fullName || "",
          email: patient.email || "",
          phone: patient.phone || "",
          dateOfBirth: patient.dateOfBirth || "",
          gender: patient.gender || "",
          address: patient.address || "",
          bloodGroup: patient.bloodGroup || "",
        };
        setProfileData(profileInfo);
        setFormData({
          fullName: profileInfo.fullName,
          phone: profileInfo.phone,
          dateOfBirth: profileInfo.dateOfBirth,
          gender: profileInfo.gender,
          address: profileInfo.address,
          bloodGroup: profileInfo.bloodGroup,
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    if (!formData.dateOfBirth) {
      toast.error("Date of birth is required");
      return;
    }
    if (!formData.gender) {
      toast.error("Gender is required");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!formData.bloodGroup) {
      toast.error("Blood group is required");
      return;
    }

    try {
      setSaving(true);
      const response = await patientService.updateProfile(formData);

      if (response.success) {
        toast.success(response.message || "Profile updated successfully");
        const patient = response.data.patient;
        const updatedProfile = {
          fullName: patient.fullName || "",
          email: patient.email || "",
          phone: patient.phone || "",
          dateOfBirth: patient.dateOfBirth || "",
          gender: patient.gender || "",
          address: patient.address || "",
          bloodGroup: patient.bloodGroup || "",
        };
        setProfileData(updatedProfile);
        setIsEditMode(false);

        // Update sessionStorage name
        sessionStorage.setItem("userName", patient.fullName);
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
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      address: profileData.address,
      bloodGroup: profileData.bloodGroup,
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
    navigate("/patient/dashboard");
  };

  const handleProfileClick = () => {
    // Already on profile page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto"></div>
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
                onClick={handleProfileClick}
                className="p-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-lg transition-colors"
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
          <div className="bg-gradient-to-r from-primary-600 to-cyan-600 border-b border-primary-500/30 px-8 py-12 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                  <UserCircle className="w-16 h-16" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    {profileData.fullName || "Your Name"}
                  </h2>
                  <p className="text-indigo-100 mt-1">{profileData.email}</p>
                </div>
              </div>
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-800 border border-gray-600 text-primary-400 rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed text-gray-500"
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
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="+911234567890"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blood Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="Enter your complete address"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="bg-primary-500/10 border border-primary-500/20 p-2 rounded-lg mt-1">
                      <User className="w-5 h-5 text-primary-400" />
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

                  {/* Date of Birth */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary-500/10 border border-primary-500/20 p-2 rounded-lg mt-1">
                      <Calendar className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">
                        Date of Birth
                      </p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.dateOfBirth
                          ? new Date(
                              profileData.dateOfBirth
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-lg mt-1">
                      <User className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Gender</p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.gender
                          ? profileData.gender.charAt(0) +
                            profileData.gender.slice(1).toLowerCase()
                          : "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-1">
                      <Droplet className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Blood Group</p>
                      <p className="text-lg font-semibold text-gray-100">
                        {profileData.bloodGroup || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address - Full width */}
                <div className="flex items-start space-x-3 pt-4 border-t">
                  <div className="bg-gold-500/10 border border-gold-500/20 p-2 rounded-lg mt-1">
                    <MapPin className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Address</p>
                    <p className="text-lg font-semibold text-gray-100">
                      {profileData.address || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientProfile;
