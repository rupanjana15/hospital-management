import React, { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Stethoscope,
  Award,
  Clock,
  IndianRupee,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
} from "lucide-react";

const DoctorDetailModal = ({
  doctor,
  specialization,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading,
}) => {
  if (!isOpen || !doctor) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-accent-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-1">
                {doctor.fullName}
              </h2>
              <p className="text-sm text-gray-400">
                Doctor Registration Details
              </p>
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
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Pending Approval</span>
            </div>

            {/* Basic Information */}
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
                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                    <Stethoscope className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Specialization</p>
                    <p className="text-sm font-medium text-gray-200">
                      {specialization?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {specialization?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-gold-500/10 border border-gold-500/20 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Qualification</p>
                    <p className="text-sm font-medium text-gray-200">
                      {doctor.qualification}
                    </p>
                  </div>
                </div>

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
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-end space-x-4">
            <button
              onClick={onReject}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-medium">Reject</span>
            </button>
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span className="font-medium">Approve Doctor</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorDetailModal;
