import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  Search,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import DoctorCard from "./DoctorCard";
import DoctorDetailModal from "./DoctorDetailModal";
import ApprovedDoctorModal from "./ApprovedDoctorModal";
import { doctorService, specializationService } from "../services/api";

// Droppable Column Component
const DroppableColumn = ({
  column,
  filteredDoctors,
  isDraggable,
  getSpecialization,
  setSelectedDoctor,
  setIsModalOpen,
  setSelectedApprovedDoctor,
  setIsApprovedModalOpen,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${column.bgClass} border ${
        column.borderClass
      } rounded-xl p-4 min-h-[500px] transition-all ${
        isOver ? "ring-2 ring-accent-500/50 shadow-lg shadow-accent-500/30" : ""
      }`}
    >
      {/* Column Header */}
      <div
        className={`${column.headerClass} rounded-lg p-3 mb-4 flex items-center justify-between`}
      >
        <h3 className="font-semibold">{column.title}</h3>
        <span className="bg-gray-900/50 px-2 py-1 rounded-full text-xs font-bold">
          {filteredDoctors.length}
        </span>
      </div>

      {/* Column Content */}
      <SortableContext
        items={filteredDoctors.map((doc) => doc.id)}
        strategy={verticalListSortingStrategy}
      >
        {filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm text-center">
              No doctors in {column.title.toLowerCase()}
            </p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              specialization={getSpecialization(doctor.specializationId)}
              onClick={
                column.id === "PENDING"
                  ? () => {
                      setSelectedDoctor(doctor);
                      setIsModalOpen(true);
                    }
                  : column.id === "APPROVED"
                  ? () => {
                      setSelectedApprovedDoctor(doctor);
                      setIsApprovedModalOpen(true);
                    }
                  : undefined
              }
              isDraggable={isDraggable}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
};

const DoctorKanbanBoard = ({ onBack }) => {
  const [doctors, setDoctors] = useState({
    PENDING: [],
    APPROVED: [],
    REJECTED: [],
    INACTIVE: [],
  });
  const [specializations, setSpecializations] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApprovedDoctor, setSelectedApprovedDoctor] = useState(null);
  const [isApprovedModalOpen, setIsApprovedModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch doctors and specializations
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [doctorsRes, specsRes] = await Promise.all([
        doctorService.getAllDoctors(),
        specializationService.getAll(),
      ]);

      // Group doctors by status
      const grouped = {
        PENDING: [],
        APPROVED: [],
        REJECTED: [],
        INACTIVE: [],
      };

      doctorsRes.data.doctors.forEach((doctor) => {
        if (grouped[doctor.status]) {
          grouped[doctor.status].push(doctor);
        }
      });

      setDoctors(grouped);
      setSpecializations(specsRes.data.specializations);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error?.errors?.[0]?.message || "Failed to fetch doctors");
    } finally {
      setIsLoading(false);
    }
  };

  // Get specialization by ID
  const getSpecialization = (specId) => {
    return specializations.find((spec) => spec.id === specId);
  };

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag over
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);

    // Extract column ID from droppable area
    let overContainer = null;
    if (over.id.toString().startsWith("column-")) {
      overContainer = over.id.replace("column-", "");
    } else if (over.data?.current?.sortable) {
      // If hovering over another card, get its column
      overContainer = findContainer(over.id);
    } else {
      overContainer = findContainer(over.id);
    }

    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return;

    // Check if move is allowed (but don't block in handleDragOver)
    // We'll validate in handleDragEnd
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);

    // Extract column ID from droppable area
    let overContainer = null;
    if (over.id.toString().startsWith("column-")) {
      overContainer = over.id.replace("column-", "");
    } else if (over.data?.current?.sortable) {
      // If dropped over another card, get its column
      overContainer = findContainer(over.id);
    } else {
      overContainer = findContainer(over.id);
    }

    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return;

    // Check if move is allowed
    if (!isValidMove(activeContainer, overContainer)) {
      toast.error(`Cannot move from ${activeContainer} to ${overContainer}`, {
        autoClose: 2000,
      });
      return;
    }

    // Find the doctor
    const doctor = doctors[activeContainer].find((doc) => doc.id === active.id);
    if (!doctor) return;

    // Optimistic update
    const newDoctors = { ...doctors };
    newDoctors[activeContainer] = newDoctors[activeContainer].filter(
      (doc) => doc.id !== active.id
    );
    newDoctors[overContainer] = [
      { ...doctor, status: overContainer },
      ...newDoctors[overContainer],
    ];



    setDoctors(newDoctors);

    // API update
    try {
      await doctorService.updateDoctorStatus(doctor.id, overContainer);
      toast.success(`Dr. ${doctor.fullName} moved to ${overContainer}`, {
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error updating doctor status:", error);
      // Revert on error
      setDoctors(doctors);
      toast.error(error?.errors?.[0]?.message || "Failed to update status");
    }
  };

  // Find which container a doctor is in
  const findContainer = (id) => {
    for (const [status, doctorList] of Object.entries(doctors)) {
      if (doctorList.some((doc) => doc.id === id)) {
        return status;
      }
    }
    return null;
  };

  // Check if move is valid based on rules
  const isValidMove = (from, to) => {
    // PENDING can move to APPROVED or REJECTED
    if (from === "PENDING" && (to === "APPROVED" || to === "REJECTED")) {
      return true;
    }
    // APPROVED can move to INACTIVE
    if (from === "APPROVED" && to === "INACTIVE") {
      return true;
    }
    // INACTIVE can move back to APPROVED
    if (from === "INACTIVE" && to === "APPROVED") {
      return true;
    }
    // All other moves are invalid
    return false;
  };



  // Handle approve from modal
  const handleApprove = async () => {
    if (!selectedDoctor) return;

    setIsUpdating(true);
    try {
      await doctorService.updateDoctorStatus(selectedDoctor.id, "APPROVED");

      // Update local state
      const newDoctors = { ...doctors };
      newDoctors.PENDING = newDoctors.PENDING.filter(
        (doc) => doc.id !== selectedDoctor.id
      );
      newDoctors.APPROVED = [
        { ...selectedDoctor, status: "APPROVED" },
        ...newDoctors.APPROVED,
      ];

      setDoctors(newDoctors);
      setIsModalOpen(false);
      setSelectedDoctor(null);
      toast.success(`Dr. ${selectedDoctor.fullName} approved successfully!`);
    } catch (error) {
      console.error("Error approving doctor:", error);
      toast.error(error?.errors?.[0]?.message || "Failed to approve doctor");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle reject from modal
  const handleReject = async () => {
    if (!selectedDoctor) return;

    setIsUpdating(true);
    try {
      await doctorService.updateDoctorStatus(selectedDoctor.id, "REJECTED");

      // Update local state
      const newDoctors = { ...doctors };
      newDoctors.PENDING = newDoctors.PENDING.filter(
        (doc) => doc.id !== selectedDoctor.id
      );
      newDoctors.REJECTED = [
        { ...selectedDoctor, status: "REJECTED" },
        ...newDoctors.REJECTED,
      ];

      setDoctors(newDoctors);
      setIsModalOpen(false);
      setSelectedDoctor(null);
      toast.error(`Dr. ${selectedDoctor.fullName} rejected`);
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      toast.error(error?.errors?.[0]?.message || "Failed to reject doctor");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle update approved doctor profile
  const handleUpdateApprovedDoctor = async (doctorId, updateData) => {
    if (!selectedApprovedDoctor) return;

    setIsUpdating(true);
    try {
      const response = await doctorService.updateDoctorBasicProfile(
        doctorId,
        updateData
      );

      // Update local state
      const updatedDoctor = response.data.doctor;
      const newDoctors = { ...doctors };

      // Find and update the doctor in APPROVED list
      const index = newDoctors.APPROVED.findIndex((doc) => doc.id === doctorId);
      if (index !== -1) {
        newDoctors.APPROVED[index] = updatedDoctor;
      }

      setDoctors(newDoctors);
      setSelectedApprovedDoctor(updatedDoctor); // Update selected doctor with new data
      toast.success(
        `${selectedApprovedDoctor.fullName}'s profile updated successfully!`
      );
    } catch (error) {
      console.error("Error updating doctor profile:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to update doctor profile"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter doctors
  const filterDoctors = (doctorList) => {
    return doctorList.filter((doctor) => {
      const matchesSearch =
        doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterSpec === "all" || doctor.specializationId === filterSpec;

      return matchesSearch && matchesFilter;
    });
  };

  // Column configuration
  const columns = [
    {
      id: "PENDING",
      title: "Pending",
      color: "gold",
      bgClass: "bg-gold-500/10",
      borderClass: "border-gold-500/30",
      headerClass: "bg-gold-500/20 text-gold-400",
    },
    {
      id: "APPROVED",
      title: "Approved",
      color: "green",
      bgClass: "bg-green-500/10",
      borderClass: "border-green-500/30",
      headerClass: "bg-green-500/20 text-green-400",
    },
    {
      id: "REJECTED",
      title: "Rejected",
      color: "red",
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/30",
      headerClass: "bg-red-500/20 text-red-400",
    },
    {
      id: "INACTIVE",
      title: "Inactive",
      color: "gray",
      bgClass: "bg-gray-500/10",
      borderClass: "border-gray-600/30",
      headerClass: "bg-gray-600/20 text-gray-400",
    },
  ];

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
              Doctor Management
            </h2>
            <p className="text-sm text-gray-400">Drag cards to update status</p>
          </div>
        </div>

      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 text-gray-300 rounded-lg focus:ring-accent-500 focus:border-accent-500 outline-none transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            value={filterSpec}
            onChange={(e) => setFilterSpec(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-600 text-gray-300 rounded-lg focus:ring-accent-500 focus:border-accent-500 outline-none appearance-none cursor-pointer min-w-[200px]"
          >
            <option value="all">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const filteredDoctors = filterDoctors(doctors[column.id]);
            const isDraggable =
              column.id === "PENDING" ||
              column.id === "APPROVED" ||
              column.id === "INACTIVE";

            return (
              <DroppableColumn
                key={column.id}
                column={column}
                filteredDoctors={filteredDoctors}
                isDraggable={isDraggable}
                getSpecialization={getSpecialization}
                setSelectedDoctor={setSelectedDoctor}
                setIsModalOpen={setIsModalOpen}
                setSelectedApprovedDoctor={setSelectedApprovedDoctor}
                setIsApprovedModalOpen={setIsApprovedModalOpen}
              />
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="opacity-80">
              <DoctorCard
                doctor={Object.values(doctors)
                  .flat()
                  .find((doc) => doc.id === activeId)}
                specialization={getSpecialization(
                  Object.values(doctors)
                    .flat()
                    .find((doc) => doc.id === activeId)?.specializationId
                )}
                isDraggable={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Doctor Detail Modal (Pending) */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        specialization={
          selectedDoctor
            ? getSpecialization(selectedDoctor.specializationId)
            : null
        }
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDoctor(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={isUpdating}
      />

      {/* Approved Doctor Profile Modal */}
      <ApprovedDoctorModal
        doctor={selectedApprovedDoctor}
        specialization={
          selectedApprovedDoctor
            ? getSpecialization(selectedApprovedDoctor.specializationId)
            : null
        }
        specializations={specializations}
        isOpen={isApprovedModalOpen}
        onClose={() => {
          setIsApprovedModalOpen(false);
          setSelectedApprovedDoctor(null);
        }}
        onSave={handleUpdateApprovedDoctor}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default DoctorKanbanBoard;
