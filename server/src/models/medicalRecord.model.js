/**
 * Medical Record Model
 * Defines the structure and validation rules for medical record entities
 */

class MedicalRecordModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.patientId = data.patientId || null;
    this.doctorId = data.doctorId || null;
    this.appointmentId = data.appointmentId || null;
    this.diagnosis = data.diagnosis || "";
    this.prescriptionText = data.prescriptionText || "";
    this.attachments = data.attachments || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();

    // Calculate editableUntil as createdAt + 24 hours
    if (data.editableUntil) {
      this.editableUntil = data.editableUntil;
    } else {
      const editableDate = new Date(this.createdAt);
      editableDate.setHours(editableDate.getHours() + 24);
      this.editableUntil = editableDate.toISOString();
    }
  }

  /**
   * Validate medical record data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Patient ID required
    if (!this.patientId) {
      errors.push("Patient ID is required");
    }

    // Doctor ID required
    if (!this.doctorId) {
      errors.push("Doctor ID is required");
    }

    // Appointment ID required
    if (!this.appointmentId) {
      errors.push("Appointment ID is required");
    }

    // Diagnosis validation (optional but recommended)
    if (this.diagnosis && this.diagnosis.length > 2000) {
      errors.push("Diagnosis must not exceed 2000 characters");
    }

    // Prescription validation (optional)
    if (this.prescriptionText && this.prescriptionText.length > 5000) {
      errors.push("Prescription text must not exceed 5000 characters");
    }

    // Attachments validation
    if (this.attachments && Array.isArray(this.attachments)) {
      this.attachments.forEach((attachment, index) => {
        const attachmentErrors = this.validateAttachment(attachment);
        if (attachmentErrors.length > 0) {
          errors.push(
            `Attachment ${index + 1}: ${attachmentErrors.join(", ")}`
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single attachment
   */
  validateAttachment(attachment) {
    const errors = [];

    if (!attachment.id) {
      errors.push("Attachment ID is required");
    }

    if (!attachment.fileName || attachment.fileName.trim().length === 0) {
      errors.push("File name is required");
    }

    if (!attachment.filePath || attachment.filePath.trim().length === 0) {
      errors.push("File path is required");
    }

    if (!attachment.uploadedAt) {
      errors.push("Upload timestamp is required");
    }

    return errors;
  }

  /**
   * Check if the record can still be edited
   */
  isEditable() {
    const now = new Date();
    const editableUntil = new Date(this.editableUntil);
    return now <= editableUntil;
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentId: this.appointmentId,
      diagnosis: this.diagnosis,
      prescriptionText: this.prescriptionText,
      attachments: this.attachments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      editableUntil: this.editableUntil,
    };
  }
}

module.exports = {
  MedicalRecordModel,
};
