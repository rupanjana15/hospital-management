import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  Stethoscope,
  Award,
  Clock,
  IndianRupee,
  Calendar,
  Loader2,
  Edit3,
  MessageCircle,
  Save,
  XCircle,
} from "lucide-react";

const ApprovedDoctorModal = ({
  doctor,
  specialization,
  specializations = [],
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    isChatOnline: false,
    qualification: "",
    specializationId: "",
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        isChatOnline: doctor.isChatOnline || false,
        qualification: doctor.qualification || "",
        specializationId: doctor.specializationId || "",
      });
    }
  }, [doctor]);

  if (!isOpen || !doctor) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = () => {
    setFormData((prev) => ({
      ...prev,
      isChatOnline: !prev.isChatOnline,
    }));
  };

  const handleSave = async () => {
    await onSave(doctor.id, formData);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      isChatOnline: doctor.isChatOnline || false,
      qualification: doctor.qualification || "",
      specializationId: doctor.specializationId || "",
    });
    setIsEditMode(false);
  };

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };

  const currentSpecialization =
    specializations.find((spec) => spec.id === formData.specializationId) ||
    specialization;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-secondary-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-1">
                {doctor.fullName}
              </h2>
              <p className="text-sm text-gray-400">
                {isEditMode ? "Edit Doctor Profile" : "Approved Doctor Profile"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Approved Doctor</span>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500/10 border border-primary-500/20 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-300 break-all">
                      {doctor.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-500/10 border border-secondary-500/20 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-secondary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm text-gray-300">{doctor.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Professional Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Specialization */}
                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                    <Stethoscope className="w-5 h-5 text-accent-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Specialization</p>
                    {isEditMode ? (
                      <select
                        name="specializationId"
                        value={formData.specializationId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500 outline-none transition-all text-sm"
                      >
                        {specializations.map((spec) => (
                          <option key={spec.id} value={spec.id}>
                            {spec.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-200">
                          {currentSpecialization?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {currentSpecialization?.description}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Qualification */}
                <div className="flex items-start space-x-3">
                  <div className="bg-gold-500/10 border border-gold-500/20 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Qualification</p>
                    {isEditMode ? (
                      <textarea
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500 outline-none transition-all text-sm resize-none"
                        placeholder="e.g., MBBS, MD (Cardiology)"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-200">
                        {doctor.qualification}
                      </p>
                    )}
                  </div>
                </div>

                {/* Experience (Read-only) */}
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500/10 border border-primary-500/20 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Experience</p>
                    <p className="text-sm font-medium text-gray-200">
                      {doctor.experienceYears} years
                    </p>
                  </div>
                </div>

                {/* Consultation Fee (Read-only) */}
                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-500/10 border border-secondary-500/20 p-2 rounded-lg">
                    <IndianRupee className="w-5 h-5 text-secondary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Consultation Fee
                    </p>
                    <p className="text-sm font-medium text-gray-200">
                      ₹{doctor.consultationFee}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Status */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-accent-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        Chat Status
                      </p>
                      <p className="text-xs text-gray-500">
                        {isEditMode
                          ? "Toggle to change availability"
                          : formData.isChatOnline
                          ? "Available for chat"
                          : "Not available for chat"}
                      </p>
                    </div>
                  </div>

                  {isEditMode ? (
                    <button
                      onClick={handleToggleChange}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        formData.isChatOnline
                          ? "bg-secondary-600"
                          : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          formData.isChatOnline
                            ? "translate-x-7"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  ) : (
                    <div
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                        formData.isChatOnline
                          ? "bg-secondary-500/10 border border-secondary-500/20 text-secondary-400"
                          : "bg-gray-600/10 border border-gray-600/20 text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          formData.isChatOnline
                            ? "bg-secondary-400"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-xs font-medium">
                        {formData.isChatOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Date */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Registration Date
                  </p>
                  <p className="text-sm text-gray-300">
                    {new Date(doctor.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Mode Info */}
            {isEditMode && (
              <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-4">
                <p className="text-sm text-accent-300">
                  ℹ️ Only Chat Status, Qualification, and Specialization can be
                  updated. Other fields are read-only.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-end space-x-4">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-all shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/50"
              >
                <Edit3 className="w-5 h-5" />
                <span className="font-medium">Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span className="font-medium">Save Changes</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovedDoctorModal;
