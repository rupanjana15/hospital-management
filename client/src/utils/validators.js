// Validation utility functions

export const validators = {
  // Full Name validation (3-80 characters, letters/spaces/dots/hyphens)
  fullName: (value) => {
    if (!value || value.trim().length === 0) {
      return "Full name is required";
    }
    if (value.length < 3 || value.length > 80) {
      return "Full name must be between 3 and 80 characters";
    }
    if (!/^[a-zA-Z\s.-]+$/.test(value)) {
      return "Full name can only contain letters, spaces, dots, and hyphens";
    }
    return "";
  },

  // Email validation
  email: (value) => {
    if (!value || value.trim().length === 0) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  },

  // Phone validation (flexible - 10-15 digits, + allowed)
  phone: (value) => {
    if (!value || value.trim().length === 0) {
      return "Phone number is required";
    }
    const phoneRegex = /^\+?[\d]{10,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-()]/g, ""))) {
      return "Please enter a valid phone number (10-15 digits)";
    }
    return "";
  },

  // Doctor phone validation (strict Indian format: +91XXXXXXXXXX)
  doctorPhone: (value) => {
    if (!value || value.trim().length === 0) {
      return "Phone number is required";
    }
    const indianPhoneRegex = /^\+91\d{10}$/;
    if (!indianPhoneRegex.test(value)) {
      return "Phone must be in format +91XXXXXXXXXX (Indian mobile number)";
    }
    return "";
  },

  // Password validation (min 8 chars, 1 letter, 1 digit)
  password: (value) => {
    if (!value || value.length === 0) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[a-zA-Z]/.test(value)) {
      return "Password must contain at least one letter";
    }
    if (!/\d/.test(value)) {
      return "Password must contain at least one digit";
    }
    return "";
  },

  // Confirm Password validation
  confirmPassword: (value, password) => {
    if (!value || value.length === 0) {
      return "Please confirm your password";
    }
    if (value !== password) {
      return "Passwords do not match";
    }
    return "";
  },

  // Date of Birth validation (YYYY-MM-DD, not future)
  dateOfBirth: (value) => {
    if (!value) return ""; // Optional field

    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }
    if (date > today) {
      return "Date of birth cannot be in the future";
    }
    return "";
  },

  // Gender validation
  gender: (value) => {
    if (!value) return ""; // Optional field
    const validGenders = ["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"];
    if (!validGenders.includes(value)) {
      return "Please select a valid gender";
    }
    return "";
  },

  // Address validation (max 255 characters)
  address: (value) => {
    if (!value) return ""; // Optional field
    if (value.length > 255) {
      return "Address must not exceed 255 characters";
    }
    return "";
  },

  // Blood Group validation
  bloodGroup: (value) => {
    if (!value) return ""; // Optional field
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodGroups.includes(value)) {
      return "Please select a valid blood group";
    }
    return "";
  },

  // Qualification validation (min 3 characters)
  qualification: (value) => {
    if (!value || value.trim().length === 0) {
      return "Qualification is required";
    }
    if (value.length < 3) {
      return "Qualification must be at least 3 characters";
    }
    return "";
  },

  // Experience Years validation (integer >= 0)
  experienceYears: (value) => {
    if (value === "" || value === null || value === undefined) {
      return "Experience years is required";
    }
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
      return "Experience years must be a non-negative integer";
    }
    return "";
  },

  // Consultation Fee validation (integer >= 0)
  consultationFee: (value) => {
    if (value === "" || value === null || value === undefined) {
      return "Consultation fee is required";
    }
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
      return "Consultation fee must be a non-negative integer";
    }
    return "";
  },

  // Specialization ID validation
  specializationId: (value) => {
    if (!value || value.trim().length === 0) {
      return "Please select a specialization";
    }
    return "";
  },
};

// Password strength checker
export const getPasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    hasMinLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasUpperCase: /[A-Z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  if (checks.hasMinLength) strength += 20;
  if (checks.hasLetter) strength += 20;
  if (checks.hasDigit) strength += 20;
  if (checks.hasUpperCase) strength += 20;
  if (checks.hasSpecialChar) strength += 20;

  let level = "weak";
  let color = "red";

  if (strength >= 80) {
    level = "strong";
    color = "green";
  } else if (strength >= 60) {
    level = "good";
    color = "blue";
  } else if (strength >= 40) {
    level = "fair";
    color = "yellow";
  }

  return { strength, level, color, checks };
};
