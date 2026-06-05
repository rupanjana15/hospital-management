import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "react-toastify";
import { doctorService, specializationService } from "../services/api";
import { validators, getPasswordStrength } from "../utils/validators";

const DoctorRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingSpecializations, setLoadingSpecializations] = useState(true);
  const [specializations, setSpecializations] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specializationId: "",
    qualification: "",
    experienceYears: "",
    consultationFee: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await specializationService.getAll();
        if (response.success && response.data) {
          setSpecializations(response.data.specializations || []);
        }
      } catch (error) {
        console.error("Error fetching specializations:", error);
        toast.error("Failed to load specializations. Please refresh the page.");
      } finally {
        setLoadingSpecializations(false);
      }
    };

    fetchSpecializations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(getPasswordStrength(value));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    let error = "";
    if (name === "confirmPassword") {
      error = validators.confirmPassword(value, formData.password);
    } else if (name === "phone") {
      error = validators.doctorPhone(value);
    } else if (validators[name]) {
      error = validators[name](value);
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};

    newErrors.fullName = validators.fullName(formData.fullName);
    newErrors.email = validators.email(formData.email);
    newErrors.phone = validators.doctorPhone(formData.phone);
    newErrors.password = validators.password(formData.password);
    newErrors.confirmPassword = validators.confirmPassword(
      formData.confirmPassword,
      formData.password
    );
    newErrors.specializationId = validators.specializationId(
      formData.specializationId
    );
    newErrors.qualification = validators.qualification(formData.qualification);
    newErrors.experienceYears = validators.experienceYears(
      formData.experienceYears
    );
    newErrors.consultationFee = validators.consultationFee(
      formData.consultationFee
    );

    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const dataToSend = {
        fullName: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        specializationId: formData.specializationId,
        qualification: formData.qualification,
        experienceYears: parseInt(formData.experienceYears, 10),
        consultationFee: parseInt(formData.consultationFee, 10),
      };

      const response = await doctorService.register(dataToSend);

      if (response.success) {
        toast.success(
          "Registration successful! Your account is pending admin approval.",
          { autoClose: 5000 }
        );
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (error.errors && Array.isArray(error.errors)) {
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
          className="flex items-center space-x-2 text-secondary-400 hover:text-secondary-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="bg-gray-800 border border-gray-700 shadow-2xl shadow-secondary-500/10 rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-secondary-500/10 border border-secondary-500/20 p-3 rounded-lg">
              <Activity className="w-7 h-7 text-secondary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100">
              Doctor Registration
            </h2>
          </div>
          <p className="text-gray-400 mb-2">
            Join our network of healthcare professionals
          </p>
          <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-3 mb-8">
            <p className="text-sm text-gold-300">
              <strong className="text-gold-400">Note:</strong> Your account will
              be pending approval by an administrator before you can start using
              the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all`}
                placeholder="Dr. John Doe"
              />
              {touched.fullName && errors.fullName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.fullName}
                </p>
              )}
            </div>

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
                } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all`}
                placeholder="doctor@example.com"
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

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
                } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all`}
                placeholder="+919876543210"
              />
              <p className="mt-1 text-xs text-gray-400">
                Format: +91XXXXXXXXXX (Indian mobile number)
              </p>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="specializationId"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Specialization <span className="text-red-500">*</span>
              </label>
              {loadingSpecializations ? (
                <div className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900">
                  <span className="text-gray-400">
                    Loading specializations...
                  </span>
                </div>
              ) : (
                <select
                  id="specializationId"
                  name="specializationId"
                  value={formData.specializationId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                    touched.specializationId && errors.specializationId
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all`}
                >
                  <option value="">Select your specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              )}
              {touched.specializationId && errors.specializationId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.specializationId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="qualification"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Qualification <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                  touched.qualification && errors.qualification
                    ? "border-red-500"
                    : "border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all`}
                placeholder="MBBS, MD"
              />
              {touched.qualification && errors.qualification && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.qualification}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="experienceYears"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="experienceYears"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="0"
                  className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                    touched.experienceYears && errors.experienceYears
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all`}
                  placeholder="5"
                />
                {touched.experienceYears && errors.experienceYears && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    {errors.experienceYears}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="consultationFee"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Consultation Fee (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="consultationFee"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="0"
                  className={`w-full px-4 py-2 border bg-gray-900 text-gray-100 placeholder-gray-500 ${
                    touched.consultationFee && errors.consultationFee
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all`}
                  placeholder="500"
                />
                {touched.consultationFee && errors.consultationFee && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    {errors.consultationFee}
                  </p>
                )}
              </div>
            </div>

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
                  } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all pr-10`}
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
                  } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all pr-10`}
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

            <button
              type="submit"
              disabled={loading || loadingSpecializations}
              className="w-full bg-secondary-600 text-white py-3 rounded-lg font-semibold hover:bg-secondary-700 focus:ring-4 focus:ring-secondary-300 shadow-lg shadow-secondary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
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
                "Register as Doctor"
              )}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-secondary-400 hover:text-secondary-300 font-medium"
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

export default DoctorRegister;
