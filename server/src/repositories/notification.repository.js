/**
 * Notification Repository
 * Handles all data access operations for notifications using JSON file storage
 */

const path = require("path");
const { readJSONFile, writeJSONFile } = require("../utils/fileHandler");
const { NotificationModel } = require("../models/notification.model");

class NotificationRepository {
  constructor() {
    this.filePath = path.join(__dirname, "../../data/notifications.json");
    this.notifications = []; // In-memory cache
  }

  /**
   * Load all notifications from JSON file into memory
   * Should be called once at server startup
   */
  async loadData() {
    try {
      const data = await readJSONFile(this.filePath);
      this.notifications = data.map((n) => new NotificationModel(n));
      console.log(
        `✓ Loaded ${this.notifications.length} notifications into memory`
      );
    } catch (error) {
      console.error("Error loading notifications:", error.message);
      this.notifications = [];
    }
  }

  /**
   * Save all notifications to JSON file
   * @private
   */
  async saveData() {
    const data = this.notifications.map((n) => n.toJSON());
    await writeJSONFile(this.filePath, data);
  }

  /**
   * Get all notifications
   * @returns {NotificationModel[]} Array of all notifications
   */
  getAll() {
    return this.notifications;
  }

  /**
   * Find notification by ID
   * @param {string} id - Notification ID
   * @returns {NotificationModel|null} Notification or null if not found
   */
  findById(id) {
    return this.notifications.find((n) => n.id === id) || null;
  }

  /**
   * Find notifications by user ID
   * @param {string} userId - User ID (patient or doctor)
   * @param {Object} filters - Optional filters
   * @returns {NotificationModel[]} Array of notifications
   */
  findByUserId(userId, filters = {}) {
    let result = this.notifications.filter((n) => n.userId === userId);

    // Apply read status filter
    if (filters.isRead !== undefined) {
      result = result.filter((n) => n.isRead === filters.isRead);
    }

    // Apply action required filter
    if (filters.actionRequired !== undefined) {
      result = result.filter(
        (n) => n.actionRequired === filters.actionRequired
      );
    }

    // Apply type filter
    if (filters.type) {
      result = result.filter((n) => n.type === filters.type);
    }

    // Sort by createdAt descending (newest first)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }

  /**
   * Find unread notifications by user ID
   * @param {string} userId - User ID
   * @returns {NotificationModel[]} Array of unread notifications
   */
  findUnreadByUserId(userId) {
    return this.findByUserId(userId, { isRead: false });
  }

  /**
   * Find notifications requiring action by user ID
   * @param {string} userId - User ID
   * @returns {NotificationModel[]} Array of notifications requiring action
   */
  findActionRequiredByUserId(userId) {
    return this.findByUserId(userId, { actionRequired: true, isRead: false });
  }

  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<NotificationModel>} Created notification
   */
  async create(notificationData) {
    const notification = new NotificationModel(notificationData);

    // Add to in-memory array
    this.notifications.push(notification);

    // Persist to file
    await this.saveData();

    return notification;
  }

  /**
   * Create multiple notifications at once
   * @param {Array<Object>} notificationsData - Array of notification data
   * @returns {Promise<NotificationModel[]>} Created notifications
   */
  async createMany(notificationsData) {
    const newNotifications = notificationsData.map(
      (data) => new NotificationModel(data)
    );

    // Add to in-memory array
    this.notifications.push(...newNotifications);

    // Persist to file
    await this.saveData();

    return newNotifications;
  }

  /**
   * Update an existing notification
   * @param {string} id - Notification ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<NotificationModel|null>} Updated notification or null if not found
   */
  async update(id, updates) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) {
      return null;
    }

    // Update notification data
    const updatedData = {
      ...this.notifications[index].toJSON(),
      ...updates,
    };

    this.notifications[index] = new NotificationModel(updatedData);

    // Persist to file
    await this.saveData();

    return this.notifications[index];
  }

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @returns {Promise<NotificationModel|null>} Updated notification or null if not found
   */
  async markAsRead(id) {
    const notification = this.findById(id);
    if (!notification) {
      return null;
    }

    notification.markAsRead();
    return await this.update(id, notification.toJSON());
  }

  /**
   * Mark multiple notifications as read
   * @param {string[]} ids - Array of notification IDs
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markManyAsRead(ids) {
    let count = 0;
    for (const id of ids) {
      const result = await this.markAsRead(id);
      if (result) count++;
    }
    return count;
  }

  /**
   * Delete a notification (permanent removal)
   * @param {string} id - Notification ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) {
      return false;
    }

    // Remove from in-memory array
    this.notifications.splice(index, 1);

    // Persist to file
    await this.saveData();

    return true;
  }
}

// Export singleton instance
module.exports = new NotificationRepository();
