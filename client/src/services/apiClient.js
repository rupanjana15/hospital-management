import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error (400, 500, etc.)
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response (network error, server down, etc.)
      // Mark as silent to prevent toast notifications during page refresh
      console.warn("Network error occurred (silent):", error.message);
      return Promise.reject({
        success: false,
        silent: true, // Flag to prevent toast notifications
        errors: [{ message: "Network error. Please check your connection." }],
      });
    } else {
      // Something else happened during request setup
      console.warn("Unexpected error occurred (silent):", error.message);
      return Promise.reject({
        success: false,
        silent: true, // Flag to prevent toast notifications
        errors: [{ message: "An unexpected error occurred." }],
      });
    }
  }
);

export default apiClient;
