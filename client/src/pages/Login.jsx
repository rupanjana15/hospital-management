import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, Eye, EyeOff, X } from "lucide-react";
import { toast } from "react-toastify";
import { authService } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password || formData.password.length === 0) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(
        formData.email.toLowerCase(),
        formData.password
      );

      if (response.success && response.data) {
        // Store token and user info
        sessionStorage.setItem("authToken", response.data.token);
        sessionStorage.setItem("userRole", response.data.role);
        sessionStorage.setItem("userName", response.data.user.fullName);
        sessionStorage.setItem("userId", response.data.user.id);

        toast.success(`Welcome back, ${response.data.user.fullName}!`);

        // Route based on role
        setTimeout(() => {
          switch (response.data.role) {
            case "PATIENT":
              navigate("/patient/dashboard");
              break;
            case "DOCTOR":
              navigate("/doctor/dashboard");
              break;
            case "ADMIN":
            case "SUPER_ADMIN":
              navigate("/admin/dashboard");
              break;
            default:
              navigate("/");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.errors && Array.isArray(error.errors)) {
        const err = error.errors[0];

        // Handle specific error codes
        if (err.code === "DOCTOR_PENDING_APPROVAL") {
          toast.warning(
            "Your account is pending admin approval. You'll be notified once approved.",
            { autoClose: 5000 }
          );
        } else if (err.code === "DOCTOR_REJECTED") {
          toast.error(
            "Your account has been rejected. Please contact support for more information.",
            { autoClose: 5000 }
          );
        } else if (err.code === "RATE_LIMIT_EXCEEDED") {
          const retryAfter = error.retryAfter
            ? Math.ceil(error.retryAfter / 60)
            : 15;
          toast.error(
            `Too many login attempts. Please try again in ${retryAfter} minutes.`,
            { autoClose: 5000 }
          );
        } else {
          toast.error(err.message || "Invalid email or password");
        }
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-primary-500/10 p-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-lg">
              <LogIn className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100">Welcome Back</h2>
          </div>
          <p className="text-gray-400 mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-900 border ${
                  errors.email ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-100 placeholder-gray-500`}
                placeholder="john@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-gray-900 border ${
                    errors.password ? "border-red-500" : "border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-100 placeholder-gray-500 pr-10`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-primary-500/30"
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
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register/patient")}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Register as Patient
                </button>
              </p>
              <p className="text-sm text-gray-400">
                Are you a doctor?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register/doctor")}
                  className="text-secondary-400 hover:text-secondary-300 font-medium"
                >
                  Register here
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Test Credentials Info */}
        <div className="mt-6 bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
          <p className="text-sm text-primary-300 font-medium mb-2">
            Test Credentials (Development Only):
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              <strong>Admin:</strong> admin@hospital.com / Admin123
            </p>
            <p>
              <strong>Doctor:</strong> ajay.menon@hospital.com /
              SecurePass123
            </p>
            <p>
              <strong>Patient:</strong> babuprasad784@gmail.com / Babu@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
