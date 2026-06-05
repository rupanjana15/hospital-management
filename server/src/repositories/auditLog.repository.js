/**
 * Audit Log Repository
 * Handles all data access operations for audit logs using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { v4: uuidv4 } = require("uuid");

class AuditLogRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/auditLogs.json");
    this.auditLogs = []; // In-memory cache
  }

  /**
   * Load all audit logs from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.auditLogs = data;
      console.log(`✓ Loaded ${this.auditLogs.length} audit logs into memory`);
    } catch (error) {
      console.error("Error loading audit logs:", error.message);
      this.auditLogs = [];
    }
  }

  /**
   * Save all audit logs to JSON file
   * @private
   */
  async saveData() {
    await writeJSONFile(this.filePath, this.auditLogs);
  }

  /**
   * Create a new audit log entry
   * @param {Object} logData - Audit log data
   * @param {string} logData.action - Action performed (LOGIN, LOGOUT, etc.)
   * @param {string} logData.performedBy - User ID who performed the action
   * @param {string} logData.performedByRole - Role of the user (PATIENT, DOCTOR, ADMIN)
   * @param {string} [logData.targetEntity] - Entity type affected (optional)
   * @param {string} [logData.targetId] - ID of the affected entity (optional)
   * @param {Object} [logData.metadata] - Additional metadata (optional)
   * @param {string} [logData.ipAddress] - IP address of the request (optional)
   * @param {string} [logData.userAgent] - User agent string (optional)
   * @returns {Promise<Object>} Created audit log
   */
  async create(logData) {
    const auditLog = {
      id: uuidv4(),
      action: logData.action,
      performedBy: logData.performedBy,
      performedByRole: logData.performedByRole,
      targetEntity: logData.targetEntity || null,
      targetId: logData.targetId || null,
      metadata: logData.metadata || {},
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      timestamp: new Date().toISOString(),
    };

    // Add to in-memory array
    this.auditLogs.push(auditLog);

    // Persist to file (asynchronously, don't block)
    this.saveData().catch((err) => {
      console.error("Failed to save audit log:", err);
    });

    return auditLog;
  }

  /**
   * Get all audit logs
   * @returns {Array} Array of all audit logs
   */
  getAll() {
    return this.auditLogs;
  }

  /**
   * Get audit logs by user ID
   * @param {string} userId - User ID
   * @returns {Array} Array of audit logs for the user
   */
  getByUserId(userId) {
    return this.auditLogs.filter((log) => log.performedBy === userId);
  }

  /**
   * Get audit logs by action type
   * @param {string} action - Action type
   * @returns {Array} Array of audit logs for the action
   */
  getByAction(action) {
    return this.auditLogs.filter((log) => log.action === action);
  }

  /**
   * Get recent audit logs (last N entries)
   * @param {number} limit - Number of logs to return
   * @returns {Array} Array of recent audit logs
   */
  getRecent(limit = 100) {
    return this.auditLogs.slice(-limit).reverse();
  }

  /**
   * Get audit logs within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of audit logs within the range
   */
  getByDateRange(startDate, endDate) {
    return this.auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }
}

// Export singleton instance
module.exports = new AuditLogRepository();
