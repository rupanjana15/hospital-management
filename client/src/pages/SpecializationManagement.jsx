import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Loader2,
  AlertCircle,
  Edit3,
  Trash2,
  MoreVertical,
  Stethoscope,
  Users,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import { specializationService, doctorService } from "../services/api";
import SpecializationModal from "../components/SpecializationModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const SpecializationManagement = ({ onBack }) => {
  const [specializations, setSpecializations] = useState([]);
  const [filteredSpecializations, setFilteredSpecializations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // 'all', 'active', 'inactive'
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [doctorCounts, setDoctorCounts] = useState({});

  useEffect(() => {
    fetchSpecializations();
    fetchDoctorCounts();
  }, []);

  const fetchSpecializations = async () => {
    try {
      setIsLoading(true);
      const response = await specializationService.getAll();
      setSpecializations(response.data.specializations);
    } catch (error) {
      console.error("Error fetching specializations:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to fetch specializations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctorCounts = async () => {
    try {
      const response = await doctorService.getAllDoctors();
      const doctors = response.data.doctors;

      // Count only APPROVED doctors per specialization
      const counts = {};
      doctors
        .filter((doctor) => doctor.status === "APPROVED")
        .forEach((doctor) => {
          const specId = doctor.specializationId;
          counts[specId] = (counts[specId] || 0) + 1;
        });

      setDoctorCounts(counts);
    } catch (error) {
      console.error("Error fetching doctor counts:", error);
    }
  };

  const filterSpecializations = useCallback(() => {
    let filtered = [...specializations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (spec) =>
          spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (spec.description &&
            spec.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((spec) => spec.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((spec) => !spec.isActive);
    }

    setFilteredSpecializations(filtered);
  }, [specializations, searchTerm, statusFilter]);

  useEffect(() => {
    filterSpecializations();
  }, [filterSpecializations]);

  const handleCreateNew = () => {
    setSelectedSpecialization(null);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEdit = (specialization) => {
    setSelectedSpecialization(specialization);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (specialization) => {
    setSelectedSpecialization(specialization);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSave = async (formData) => {
    try {
      setIsUpdating(true);

      if (selectedSpecialization) {
        // Update existing
        const response = await specializationService.update(
          selectedSpecialization.id,
          formData
        );

        // Update local state
        setSpecializations((prev) =>
          prev.map((spec) =>
            spec.id === selectedSpecialization.id
              ? response.data.specialization
              : spec
          )
        );

        toast.success("Specialization updated successfully!");
      } else {
        // Create new
        const response = await specializationService.create(formData);

        // Add to local state
        setSpecializations((prev) => [response.data.specialization, ...prev]);

        toast.success("Specialization created successfully!");
      }

      setIsModalOpen(false);
      setSelectedSpecialization(null);
    } catch (error) {
      console.error("Error saving specialization:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to save specialization"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSpecialization) return;

    try {
      setIsUpdating(true);
      await specializationService.delete(selectedSpecialization.id);

      // Update local state - soft delete sets isActive to false
      setSpecializations((prev) =>
        prev.map((spec) =>
          spec.id === selectedSpecialization.id
            ? { ...spec, isActive: false }
            : spec
        )
      );

      toast.success("Specialization deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedSpecialization(null);
    } catch (error) {
      console.error("Error deleting specialization:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to delete specialization"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (specialization) => {
    try {
      const newStatus = !specialization.isActive;
      await specializationService.toggleStatus(specialization.id, newStatus);

      // Update local state
      setSpecializations((prev) =>
        prev.map((spec) =>
          spec.id === specialization.id
            ? { ...spec, isActive: newStatus }
            : spec
        )
      );

      toast.success(
        `Specialization ${
          newStatus ? "activated" : "deactivated"
        } successfully!`
      );
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error(error?.errors?.[0]?.message || "Failed to update status");
    }
  };

  const toggleMenu = (specId) => {
    setOpenMenuId(openMenuId === specId ? null : specId);
  };

  const activeCount = specializations.filter((s) => s.isActive).length;
  const inactiveCount = specializations.filter((s) => !s.isActive).length;

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
              Specialization Management
            </h2>
            <p className="text-sm text-gray-400">
              Manage medical specializations and categories
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-all shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Specialization</span>
        </button>
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
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or description..."
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
        {filteredSpecializations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No specializations found</p>
            <p className="text-sm text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first specialization to get started"}
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
                    Description
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Doctors
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredSpecializations.map((spec) => {
                  const doctorCount = doctorCounts[spec.id] || 0;

                  return (
                    <tr
                      key={spec.id}
                      className="hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                            spec.isActive
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : "bg-gray-600/10 border border-gray-600/20 text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              spec.isActive ? "bg-green-400" : "bg-gray-400"
                            }`}
                          />
                          <span>{spec.isActive ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
                            <Stethoscope className="w-4 h-4 text-accent-400" />
                          </div>
                          <span className="font-medium text-gray-200">
                            {spec.name}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-400 max-w-md truncate">
                          {spec.description || "No description"}
                        </p>
                      </td>

                      {/* Doctor Count */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-300">
                            {doctorCount}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={() => toggleMenu(spec.id)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === spec.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div
                                className={`absolute right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 py-1 ${
                                  filteredSpecializations.indexOf(spec) < 3
                                    ? "top-full mt-2" // Open downward for top rows
                                    : "bottom-full mb-2" // Open upward for bottom rows
                                }`}
                              >
                                <button
                                  onClick={() => handleEdit(spec)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(spec)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2"
                                >
                                  {spec.isActive ? (
                                    <>
                                      <XCircle className="w-4 h-4" />
                                      <span>Deactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      <span>Activate</span>
                                    </>
                                  )}
                                </button>
                                <hr className="border-gray-700 my-1" />
                                <button
                                  onClick={() => handleDelete(spec)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center space-x-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
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

      {/* Create/Edit Modal */}
      <SpecializationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSpecialization(null);
        }}
        onSave={handleSave}
        specialization={selectedSpecialization}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSpecialization(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isUpdating}
        title="Delete Specialization"
        message="Are you sure you want to delete this specialization?"
        itemName={selectedSpecialization?.name}
        doctorCount={
          selectedSpecialization
            ? doctorCounts[selectedSpecialization.id] || 0
            : 0
        }
        warningText="This action cannot be undone. The specialization will be marked as inactive."
      />
    </div>
  );
};

export default SpecializationManagement;
