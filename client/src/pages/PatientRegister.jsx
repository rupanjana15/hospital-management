import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "react-toastify";
import { patientService } from "../services/api";
import { validators, getPasswordStrength } from "../utils/validators";

const PatientRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Update password strength
    if (name === "password") {
      setPasswordStrength(getPasswordStrength(value));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate field on blur
    let error = "";
    if (name === "confirmPassword") {
      error = validators.confirmPassword(value, formData.password);
    } else if (validators[name]) {
      error = validators[name](value);
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};

    newErrors.fullName = validators.fullName(formData.fullName);
    newErrors.email = validators.email(formData.email);
    newErrors.phone = validators.phone(formData.phone);
    newErrors.password = validators.password(formData.password);
    newErrors.confirmPassword = validators.confirmPassword(
      formData.confirmPassword,
      formData.password
    );

    // Optional fields
    if (formData.dateOfBirth) {
      newErrors.dateOfBirth = validators.dateOfBirth(formData.dateOfBirth);
    }
    if (formData.gender) {
      newErrors.gender = validators.gender(formData.gender);
    }
    if (formData.address) {
      newErrors.address = validators.address(formData.address);
    }
    if (formData.bloodGroup) {
      newErrors.bloodGroup = validators.bloodGroup(formData.bloodGroup);
    }

    // Remove empty errors
    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API (remove empty optional fields)
      const dataToSend = {
        fullName: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      if (formData.dateOfBirth) dataToSend.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) dataToSend.gender = formData.gender;
      if (formData.address) dataToSend.address = formData.address;
      if (formData.bloodGroup) dataToSend.bloodGroup = formData.bloodGroup;

      const response = await patientService.register(dataToSend);

      if (response.success) {
        toast.success("Registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (error.errors && Array.isArray(error.errors)) {
        // Handle validation errors from backend
        error.errors.forEach((err) => {
          if (err.field) {
            setErrors((prev) => ({ ...prev, [err.field]: err.message }));
          }
          toast.error(err.message);
        });
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="bg-gray-800 border border-gray-700 shadow-2xl shadow-primary-500/10 rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-lg">
              <Users className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100">
              Patient Registration
            </h2>
          </div>
          <p className="text-gray-400 mb-8">
            Create your patient account to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                  touched.fullName && errors.fullName
                    ? "border-red-500"
                    : "border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                placeholder="John Doe"
              />
              {touched.fullName && errors.fullName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                  touched.email && errors.email
                    ? "border-red-500"
                    : "border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                placeholder="john@example.com"
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                  touched.phone && errors.phone
                    ? "border-red-500"
                    : "border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                placeholder="+911234567890"
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                    touched.password && errors.password
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Password strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.color === "green"
                          ? "text-green-600"
                          : passwordStrength.color === "blue"
                          ? "text-blue-600"
                          : passwordStrength.color === "yellow"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordStrength.level}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength.color === "green"
                          ? "bg-green-500"
                          : passwordStrength.color === "blue"
                          ? "bg-blue-500"
                          : passwordStrength.color === "yellow"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p
                      className={`text-xs flex items-center ${
                        passwordStrength.checks.hasMinLength
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {passwordStrength.checks.hasMinLength ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <X className="w-3 h-3 mr-1" />
                      )}
                      At least 8 characters
                    </p>
                    <p
                      className={`text-xs flex items-center ${
                        passwordStrength.checks.hasLetter
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {passwordStrength.checks.hasLetter ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <X className="w-3 h-3 mr-1" />
                      )}
                      Contains a letter
                    </p>
                    <p
                      className={`text-xs flex items-center ${
                        passwordStrength.checks.hasDigit
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {passwordStrength.checks.hasDigit ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <X className="w-3 h-3 mr-1" />
                      )}
                      Contains a digit
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                    touched.confirmPassword && errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Optional Fields Section */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Optional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date of Birth */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                      touched.dateOfBirth && errors.dateOfBirth
                        ? "border-red-500"
                        : "border-gray-600"
                    } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  />
                  {touched.dateOfBirth && errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                      touched.gender && errors.gender
                        ? "border-red-500"
                        : "border-gray-600"
                    } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="NOT_SPECIFIED">Prefer not to say</option>
                  </select>
                  {touched.gender && errors.gender && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Blood Group */}
                <div>
                  <label
                    htmlFor="bloodGroup"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Blood Group
                  </label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                      touched.bloodGroup && errors.bloodGroup
                        ? "border-red-500"
                        : "border-gray-600"
                    } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
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
                  {touched.bloodGroup && errors.bloodGroup && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      {errors.bloodGroup}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mt-6">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows="3"
                  className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                    touched.address && errors.address
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="123 Main Street, City, State"
                ></textarea>
                {touched.address && errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                "Register"
              )}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Sign in here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
