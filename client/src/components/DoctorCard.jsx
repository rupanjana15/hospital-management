import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Stethoscope,
  Clock,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  MinusCircle,
} from "lucide-react";

const DoctorCard = ({ doctor, specialization, onClick, isDraggable }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: doctor.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "PENDING":
        return {
          icon: AlertCircle,
          color: "gold",
          bgClass: "bg-gold-500/10 border-gold-500/20 text-gold-400",
          cardBorder: "border-gold-500/30",
        };
      case "APPROVED":
        return {
          icon: CheckCircle,
          color: "green",
          bgClass: "bg-green-500/10 border-green-500/20 text-green-400",
          cardBorder: "border-green-500/30",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          color: "red",
          bgClass: "bg-red-500/10 border-red-500/20 text-red-400",
          cardBorder: "border-red-500/30",
        };
      case "INACTIVE":
        return {
          icon: MinusCircle,
          color: "gray",
          bgClass: "bg-gray-500/10 border-gray-500/20 text-gray-400",
          cardBorder: "border-gray-600/30",
        };
      default:
        return {
          icon: AlertCircle,
          color: "gray",
          bgClass: "bg-gray-500/10 border-gray-500/20 text-gray-400",
          cardBorder: "border-gray-600/30",
        };
    }
  };

  const statusConfig = getStatusConfig(doctor.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      className={`bg-gray-800 border ${
        statusConfig.cardBorder
      } rounded-lg shadow-lg p-4 mb-3 ${
        onClick ? "cursor-pointer hover:shadow-xl" : ""
      } ${
        isDraggable
          ? "hover:scale-[1.02] cursor-grab active:cursor-grabbing"
          : ""
      } transition-all group relative`}
      onClick={onClick}
    >
      {/* Drag Handle Indicator */}
      {isDraggable && (
        <div className="absolute top-2 right-2 p-1 rounded opacity-50 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
      )}

      {/* Status Badge */}
      <div
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${statusConfig.bgClass} text-xs font-medium mb-3`}
      >
        <StatusIcon className="w-3 h-3" />
        <span>{doctor.status}</span>
      </div>

      {/* Doctor Info */}
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-gray-100 mb-1 pr-6">
          {doctor.fullName}
        </h4>
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <Stethoscope className="w-4 h-4 text-secondary-400" />
          <span>{specialization?.name || "Unknown Specialization"}</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{doctor.experienceYears} years exp</span>
          </div>
          <div className="flex items-center space-x-1">
            <IndianRupee className="w-3 h-3" />
            <span>₹{doctor.consultationFee}</span>
          </div>
        </div>
      </div>

      {/* Email (visible on hover for PENDING) */}
      {doctor.status === "PENDING" && (
        <div className="mt-3 pt-3 border-t border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-gray-500 truncate">{doctor.email}</p>
        </div>
      )}
    </div>
  );
};

export default DoctorCard;
