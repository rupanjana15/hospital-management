import React from "react";
import { AlertTriangle, X, Trash2, Loader2 } from "lucide-react";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
  itemName,
  warningText,
  doctorCount,
}) => {
  if (!isOpen) return null;

  const canDelete = doctorCount === 0 || doctorCount === undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-red-500/20 max-w-md w-full animate-slide-up">
          {/* Header */}
          <div className="bg-red-500/10 border-b border-red-500/20 p-6 flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <div className="bg-red-500/20 border border-red-500/30 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100 mb-1">
                  {title || "Confirm Deletion"}
                </h2>
                <p className="text-sm text-red-400">This action is permanent</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-300">
              {message || "Are you sure you want to delete this item?"}
            </p>

            {itemName && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Item to delete:</p>
                <p className="text-lg font-semibold text-gray-100">
                  {itemName}
                </p>
                {doctorCount !== undefined && (
                  <p className="text-sm text-gray-400 mt-2">
                    Doctors using this:{" "}
                    <span className="font-bold text-gray-200">
                      {doctorCount}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Cannot delete warning */}
            {!canDelete && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-1">
                      Cannot Delete
                    </p>
                    <p className="text-sm text-red-300">
                      This specialization is currently being used by{" "}
                      {doctorCount} doctor
                      {doctorCount !== 1 ? "s" : ""}. Please reassign or remove
                      these doctors before deleting.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning text */}
            {canDelete && warningText && (
              <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gold-300">{warningText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-900 border-t border-gray-700 p-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || !canDelete}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              <span className="font-medium">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmModal;
