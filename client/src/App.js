import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import PatientRegister from "./pages/PatientRegister";
import DoctorRegister from "./pages/DoctorRegister";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProfile from "./pages/PatientProfile";
import FindDoctors from "./pages/FindDoctors";
import BookAppointment from "./pages/BookAppointment";
import UpcomingAppointments from "./pages/UpcomingAppointments";
import AppointmentHistory from "./pages/AppointmentHistory";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import ManageSchedule from "./pages/ManageSchedule";
import ApplyLeave from "./pages/ApplyLeave";
import DoctorAppointments from "./pages/DoctorAppointments";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/patient" element={<PatientRegister />} />
        <Route path="/register/doctor" element={<DoctorRegister />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/find-doctors" element={<FindDoctors />} />
        <Route
          path="/patient/appointments"
          element={<UpcomingAppointments />}
        />
        <Route
          path="/patient/appointment-history"
          element={<AppointmentHistory />}
        />
        <Route
          path="/patient/book-appointment/:doctorId"
          element={<BookAppointment />}
        />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/doctor/schedule" element={<ManageSchedule />} />
        <Route path="/doctor/leave" element={<ApplyLeave />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route
          path="/doctor/appointments/:appointmentId"
          element={<DoctorAppointments />}
        />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;
