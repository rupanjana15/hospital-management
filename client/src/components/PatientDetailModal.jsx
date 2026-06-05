import React from "react";
import {
  X,
  Mail,
  Phone,
  User,
  Calendar,
  MapPin,
  Droplet,
  Clock,
  Loader2,
  Power,
} from "lucide-react";

const PatientDetailModal = ({
  patient,
  isOpen,
  onClose,
  onToggleStatus,
  isLoading,
}) => {
  if (!isOpen || !patient) return null;

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const age = calculateAge(patient.dateOfBirth);
  const genderIcon =
    patient.gender === "MALE"
      ? "👨"
      : patient.gender === "FEMALE"
      ? "👩"
      : "⚧️";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-primary-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-1">
                {patient.fullName}
              </h2>
              <p className="text-sm text-gray-400">Patient Information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                patient.status === "ACTIVE"
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-gray-600/10 border border-gray-600/20 text-gray-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  patient.status === "ACTIVE" ? "bg-green-400" : "bg-gray-400"
                }`}
              />
              <span className="text-sm font-medium">
                {patient.status === "ACTIVE" ? "Active" : "Inactive"}
              </span>
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
                      {patient.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-500/10 border border-secondary-500/20 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-secondary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm text-gray-300">{patient.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Personal Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                    <User className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                    <p className="text-sm text-gray-300">
                      {genderIcon} {patient.gender}
                    </p>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex items-start space-x-3">
                  <div className="bg-gold-500/10 border border-gold-500/20 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                    <p className="text-sm text-gray-300">
                      {formatDate(patient.dateOfBirth)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {age} years old
                    </p>
                  </div>
                </div>

                {/* Blood Group */}
                <div className="flex items-start space-x-3">
                  <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                    <Droplet className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Blood Group</p>
                    <p className="text-sm font-medium text-gray-200">
                      {patient.bloodGroup}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm text-gray-300">{patient.address}</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Account Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">Registered</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    {formatDate(patient.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">Last Login</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    {getRelativeTime(patient.lastLoginAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">Last Updated</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    {formatDate(patient.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
            <button
              onClick={() => onToggleStatus(patient.id)}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                patient.status === "ACTIVE"
                  ? "bg-gray-600 hover:bg-gray-700 text-gray-300 shadow-gray-500/30 hover:shadow-gray-500/50"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-green-500/30 hover:shadow-green-500/50"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Power className="w-5 h-5" />
              )}
              <span className="font-medium">
                {patient.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientDetailModal;
