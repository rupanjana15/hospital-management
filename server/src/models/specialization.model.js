/**
 * Specialization Model
 * Defines the structure for medical specializations
 */

class SpecializationModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || "";
    this.description = data.description || "";
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  /**
   * Validate specialization data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Name validation (required, unique)
    if (!this.name || this.name.trim().length === 0) {
      errors.push("Specialization name is required");
    }

    if (this.name && this.name.length > 100) {
      errors.push("Specialization name must not exceed 100 characters");
    }

    // Description validation (optional)
    if (this.description && this.description.length > 500) {
      errors.push("Description must not exceed 500 characters");
    }

    // isActive must be boolean
    if (typeof this.isActive !== "boolean") {
      errors.push("isActive must be a boolean value");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to plain object for JSON storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
    };
  }
}

module.exports = {
  SpecializationModel,
};
