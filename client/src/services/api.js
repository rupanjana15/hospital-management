import apiClient from "./apiClient";

// Auth Service
export const authService = {
  // Unified login
  login: async (email, password) => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },
};

// Patient Service
export const patientService = {
  // Register patient
  register: async (data) => {
    const response = await apiClient.post("/patients/register", data);
    return response.data;
  },

  // Get current patient profile
  getProfile: async () => {
    const response = await apiClient.get("/patients/me");
    return response.data;
  },

  // Update patient profile
  updateProfile: async (data) => {
    const response = await apiClient.put("/patients/me", data);
    return response.data;
  },

  // Get all patients (Admin only)
  getAllPatients: async () => {
    const response = await apiClient.get("/admin/patients");
    return response.data;
  },

  // Get patient by ID (Admin only)
  getPatientById: async (id) => {
    const response = await apiClient.get(`/admin/patients/${id}`);
    return response.data;
  },

  // Toggle patient status (Admin only)
  togglePatientStatus: async (id) => {
    const response = await apiClient.patch(`/admin/patients/${id}/status`);
    return response.data;
  },

  // Get patient's appointments
  getAppointments: async (patientId, status, startDate, endDate) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const url = `/patients/${patientId}/appointments${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient.get(url);
    return response.data;
  },

  // Get upcoming appointments count
  getUpcomingAppointmentsCount: async () => {
    const response = await apiClient.get(
      "/patients/me/upcoming-appointments/count"
    );
    return response.data;
  },
};

// Doctor Service
export const doctorService = {
  // Register doctor
  register: async (data) => {
    const response = await apiClient.post("/doctors/register", data);
    return response.data;
  },

  // Get approved doctors
  getApprovedDoctors: async () => {
    const response = await apiClient.get("/doctors/approved");
    return response.data;
  },

  // Get all doctors (Admin only)
  getAllDoctors: async () => {
    const response = await apiClient.get("/doctors");
    return response.data;
  },

  // Get doctor by ID
  getDoctorById: async (id) => {
    const response = await apiClient.get(`/doctors/${id}`);
    return response.data;
  },

  // Update doctor status (Admin only)
  updateDoctorStatus: async (id, status) => {
    const response = await apiClient.patch(`/doctors/${id}/status`, { status });
    return response.data;
  },

  // Update doctor basic profile (Admin/Doctor)
  updateDoctorBasicProfile: async (id, data) => {
    const response = await apiClient.patch(`/doctors/${id}/basic`, data);
    return response.data;
  },

  // Update current doctor's profile (Doctor only)
  updateProfile: async (data) => {
    const response = await apiClient.put("/doctors/me", data);
    return response.data;
  },

  // Get current doctor's profile (Doctor only)
  getProfile: async () => {
    const response = await apiClient.get("/doctors/me");
    return response.data;
  },

  // Get doctor's slots
  getSlots: async (doctorId, startDate, endDate, status) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (status) params.append("status", status);
    const response = await apiClient.get(
      `/doctors/${doctorId}/slots?${params.toString()}`
    );
    return response.data;
  },

  // Create quick slots
  createQuickSlots: async (doctorId, data) => {
    const response = await apiClient.post(
      `/doctors/${doctorId}/slots/quick-create`,
      data
    );
    return response.data;
  },

  // Create bulk slots (manual)
  createBulkSlots: async (doctorId, data) => {
    const response = await apiClient.post(
      `/doctors/${doctorId}/slots/bulk-create`,
      data
    );
    return response.data;
  },

  // Delete slots in bulk
  deleteBulkSlots: async (doctorId, data) => {
    const response = await apiClient.delete(
      `/doctors/${doctorId}/slots/bulk-delete`,
      { data }
    );
    return response.data;
  },

  // Update slot status in bulk (block/unblock)
  bulkUpdateSlotStatus: async (doctorId, data) => {
    const response = await apiClient.patch(
      `/doctors/${doctorId}/slots/bulk-status`,
      data
    );
    return response.data;
  },

  // Leave Management
  applyLeave: async (doctorId, data) => {
    const response = await apiClient.post(`/doctors/${doctorId}/leaves`, data);
    return response.data;
  },

  cancelLeave: async (doctorId, leaveId) => {
    const response = await apiClient.delete(
      `/doctors/${doctorId}/leaves/${leaveId}`
    );
    return response.data;
  },

  // Get doctor's leaves
  getLeaves: async (doctorId, status, startDate, endDate) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    const response = await apiClient.get(
      `/doctors/${doctorId}/leaves${queryString ? `?${queryString}` : ""}`
    );
    return response.data;
  },

  // Get doctor's appointments
  getAppointments: async (doctorId, status) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    const queryString = params.toString();
    const response = await apiClient.get(
      `/doctors/${doctorId}/appointments${queryString ? `?${queryString}` : ""}`
    );
    return response.data;
  },
};

// Specialization Service
export const specializationService = {
  // Get all specializations (both active and inactive)
  getAll: async () => {
    const response = await apiClient.get("/specializations");
    return response.data;
  },

  // Get only active specializations
  getActive: async () => {
    const response = await apiClient.get("/specializations/active");
    return response.data;
  },

  // Get specialization by ID
  getById: async (id) => {
    const response = await apiClient.get(`/specializations/${id}`);
    return response.data;
  },

  // Create new specialization (Admin only)
  create: async (data) => {
    const response = await apiClient.post("/specializations", data);
    return response.data;
  },

  // Update specialization (Admin only)
  update: async (id, data) => {
    const response = await apiClient.put(`/specializations/${id}`, data);
    return response.data;
  },

  // Delete specialization (Admin only) - Soft delete
  delete: async (id) => {
    const response = await apiClient.delete(`/specializations/${id}`);
    return response.data;
  },

  // Toggle specialization status
  toggleStatus: async (id, isActive) => {
    const response = await apiClient.put(`/specializations/${id}`, {
      isActive,
    });
    return response.data;
  },
};

// Appointment Service
export const appointmentService = {
  // Book an appointment
  bookAppointment: async (data) => {
    const response = await apiClient.post("/appointments/book", data);
    return response.data;
  },

  // Get patient's appointments
  getMyAppointments: async () => {
    const response = await apiClient.get("/appointments/my");
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    const response = await apiClient.delete(
      `/appointments/${appointmentId}/cancel`,
      {
        data: { reason },
      }
    );
    return response.data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, newSlotId) => {
    const response = await apiClient.put(
      `/appointments/${appointmentId}/reschedule`,
      {
        newSlotId,
      }
    );
    return response.data;
  },

  // Get appointment details
  getAppointmentDetails: async (appointmentId) => {
    const response = await apiClient.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Complete appointment (Doctor only)
  completeAppointment: async (appointmentId) => {
    const response = await apiClient.put(
      `/appointments/${appointmentId}/complete`
    );
    return response.data;
  },
};

// Bill Service
export const billService = {
  // Get patient's bills
  getPatientBills: async (patientId, status, startDate, endDate) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const url = `/bills/patients/${patientId}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient.get(url);
    return response.data;
  },

  // Pay a bill
  payBill: async (billId, paymentData) => {
    const response = await apiClient.patch(`/bills/${billId}/pay`, paymentData);
    return response.data;
  },
};

// Admin Service
export const adminService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await apiClient.get("/admin/dashboard/stats");
    return response.data;
  },
};
