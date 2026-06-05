import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Eye,
  Power,
  MoreVertical,
  Users,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  ChevronDown,
  Droplet,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { patientService } from "../services/api";
import PatientDetailModal from "../components/PatientDetailModal";

const PatientManagement = ({ onBack }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // 'all', 'active', 'inactive'
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const filterPatients = useCallback(() => {
    let filtered = [...patients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((patient) => patient.status === "ACTIVE");
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((patient) => patient.status === "INACTIVE");
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, statusFilter]);

  useEffect(() => {
    filterPatients();
  }, [filterPatients]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await patientService.getAllPatients();
      setPatients(response.data.patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error(error?.errors?.[0]?.message || "Failed to fetch patients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
    setOpenMenuId(null);
  };

  const handleToggleStatus = async (patientId) => {
    try {
      setIsUpdating(true);
      const response = await patientService.togglePatientStatus(patientId);

      toast.success(response.message || "Patient status updated successfully!");

      // Refetch patients to ensure data consistency
      await fetchPatients();

      // Close modal if open
      setIsDetailModalOpen(false);
      setSelectedPatient(null);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error toggling patient status:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to update patient status"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleMenu = (patientId) => {
    setOpenMenuId(openMenuId === patientId ? null : patientId);
  };

  // Calculate age
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
    return `${diffDays}d ago`;
  };

  const activeCount = patients.filter((p) => p.status === "ACTIVE").length;
  const inactiveCount = patients.filter((p) => p.status === "INACTIVE").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">
              Patient Management
            </h2>
            <p className="text-sm text-gray-400">
              View and manage patient accounts
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-gray-400">Active:</span>
          <span className="font-bold text-green-400">{activeCount}</span>
        </div>
        <div className="flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">Inactive:</span>
          <span className="font-bold text-gray-400">{inactiveCount}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-accent-400" />
          <span className="text-gray-400">Total:</span>
          <span className="font-bold text-accent-400">{patients.length}</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 text-gray-300 rounded-lg focus:ring-accent-500 focus:border-accent-500 outline-none transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-600 text-gray-300 rounded-lg focus:ring-accent-500 focus:border-accent-500 outline-none appearance-none cursor-pointer min-w-[200px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No patients found</p>
            <p className="text-sm text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No patients registered yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Gender & Age
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Blood Group
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredPatients.map((patient, index) => {
                  const age = calculateAge(patient.dateOfBirth);
                  const genderIcon =
                    patient.gender === "MALE"
                      ? "👨"
                      : patient.gender === "FEMALE"
                      ? "👩"
                      : "⚧️";

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(patient)}
                    >
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                            patient.status === "ACTIVE"
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : "bg-gray-600/10 border border-gray-600/20 text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              patient.status === "ACTIVE"
                                ? "bg-green-400"
                                : "bg-gray-400"
                            }`}
                          />
                          <span>
                            {patient.status === "ACTIVE"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary-500/10 border border-primary-500/20 p-2 rounded-lg">
                            <User className="w-4 h-4 text-primary-400" />
                          </div>
                          <span className="font-medium text-gray-200">
                            {patient.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">
                              {patient.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Gender & Age */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-300">
                            {genderIcon} {patient.gender}
                          </p>
                          <p className="text-xs text-gray-500">{age} years</p>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Droplet className="w-4 h-4 text-red-400" />
                          <span className="font-semibold text-gray-300">
                            {patient.bloodGroup}
                          </span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-400">
                          {getRelativeTime(patient.lastLoginAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-block">
                          <button
                            onClick={() => toggleMenu(patient.id)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === patient.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div
                                className={`absolute right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 py-1 ${
                                  filteredPatients.length - index <= 2
                                    ? "bottom-full mb-2"
                                    : "top-full mt-2"
                                }`}
                              >
                                <button
                                  onClick={() => handleViewDetails(patient)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View Details</span>
                                </button>
                                <hr className="border-gray-700 my-1" />
                                <button
                                  onClick={() => handleToggleStatus(patient.id)}
                                  disabled={isUpdating}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    patient.status === "ACTIVE"
                                      ? "text-gray-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  <Power className="w-4 h-4" />
                                  <span>
                                    {patient.status === "ACTIVE"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPatient(null);
        }}
        onToggleStatus={handleToggleStatus}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default PatientManagement;
