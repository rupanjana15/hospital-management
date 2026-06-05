import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Stethoscope, FileText } from "lucide-react";

const SpecializationModal = ({
  isOpen,
  onClose,
  onSave,
  specialization,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (specialization) {
      // Edit mode
      setFormData({
        name: specialization.name || "",
        description: specialization.description || "",
        isActive:
          specialization.isActive !== undefined
            ? specialization.isActive
            : true,
      });
    } else {
      // Create mode
      setFormData({
        name: "",
        description: "",
        isActive: true,
      });
    }
    setErrors({});
  }, [specialization, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must not exceed 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleStatusChange = (isActive) => {
    setFormData((prev) => ({
      ...prev,
      isActive,
    }));
  };

  const isEditMode = !!specialization;
  const charCount = formData.description.length;

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
                {isEditMode ? "Edit Specialization" : "New Specialization"}
              </h2>
              <p className="text-sm text-gray-400">
                {isEditMode
                  ? "Update specialization details"
                  : "Add a new medical specialization"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Stethoscope className="w-4 h-4 text-accent-400" />
                <span>
                  Name <span className="text-red-400">*</span>
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Cardiology, Dermatology"
                className={`w-full px-4 py-3 bg-gray-900 border ${
                  errors.name ? "border-red-500" : "border-gray-600"
                } text-gray-300 rounded-lg focus:ring-accent-500 focus:border-accent-500 outline-none transition-all`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                2-100 characters required
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 text-accent-400" />
                <span>Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the medical specialization (optional)"
                className={`w-full px-4 py-3 bg-gray-900 border ${
                  errors.description ? "border-red-500" : "border-gray-600"
                } text-gray-300 rounded-lg focus:ring-accent-500 focus:border-accent-500 outline-none transition-all resize-none`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.description}
                </p>
              )}
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Optional field</p>
                <p
                  className={`text-xs ${
                    charCount > 500 ? "text-red-400" : "text-gray-500"
                  }`}
                >
                  {charCount}/500 characters
                </p>
              </div>
            </div>

            {/* Status Field */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-3 block">
                Status
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleStatusChange(true)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.isActive
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : "bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.isActive
                          ? "border-green-400 bg-green-400"
                          : "border-gray-500"
                      }`}
                    >
                      {formData.isActive && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-medium">Active</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(false)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    !formData.isActive
                      ? "bg-gray-600/20 border-gray-500 text-gray-400"
                      : "bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        !formData.isActive
                          ? "border-gray-400 bg-gray-400"
                          : "border-gray-500"
                      }`}
                    >
                      {!formData.isActive && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-medium">Inactive</span>
                  </div>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {isEditMode
                  ? "Toggle to activate or deactivate this specialization"
                  : "New specializations are active by default"}
              </p>
            </div>

            {/* Info Note */}
            {!isEditMode && (
              <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-4">
                <p className="text-sm text-accent-300 flex items-start">
                  <span className="mr-2">ℹ️</span>
                  <span>
                    New specializations will be immediately available for doctor
                    registration once created.
                  </span>
                </p>
              </div>
            )}
          </form>

          {/* Actions */}
          <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span className="font-medium">
                {isEditMode ? "Save Changes" : "Create Specialization"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SpecializationModal;
