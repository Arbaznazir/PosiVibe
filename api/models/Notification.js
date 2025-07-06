// Notification model for tracking user interactions
// Types: like, comment, follow, mention, post

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["like", "comment", "follow", "mention", "post"],
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    message: {
      type: String,
      required: true,
      maxlength: 200,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ toUserId: 1, createdAt: -1 });
notificationSchema.index({ toUserId: 1, read: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

/**
 * Create notification message based on type
 * @param {string} type - Notification type
 * @param {Object} data - Additional data for message generation
 * @returns {string} Generated message
 */
export const generateNotificationMessage = (type, data = {}) => {
  switch (type) {
    case "like":
      return `liked your post`;
    case "comment":
      return `commented on your post`;
    case "follow":
      return `started following you`;
    case "mention":
      return `mentioned you in a comment`;
    case "post":
      return `shared a new post`;
    default:
      return `interacted with your content`;
  }
};

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Object} The created notification
 */
export const createNotification = async (notificationData) => {
  try {
    const notification = new Notification({
      type: notificationData.type,
      fromUserId: notificationData.fromUserId,
      toUserId: notificationData.toUserId,
      postId: notificationData.postId || null,
      commentId: notificationData.commentId || null,
      message:
        notificationData.message ||
        generateNotificationMessage(notificationData.type),
    });

    const savedNotification = await notification.save();
    console.log(
      `📧 New notification created: ${savedNotification.type} from user ${savedNotification.fromUserId} to user ${savedNotification.toUserId}`
    );

    return savedNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

/**
 * Get notifications for a specific user
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Array} Array of notifications with user details
 */
export const getNotificationsForUser = async (userId, limit = 20) => {
  try {
    const notifications = await Notification.find({ toUserId: userId })
      .populate("fromUserId", "name username profilePic")
      .populate("postId", "desc img")
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - The notification ID
 * @param {string} userId - The user ID (for security)
 * @returns {boolean} Success status
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, toUserId: userId },
      { read: true },
      { new: true }
    );

    return !!result;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 * @returns {number} Number of notifications marked as read
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { toUserId: userId, read: false },
      { read: true }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return 0;
  }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - The user ID
 * @returns {number} Number of unread notifications
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      toUserId: userId,
      read: false,
    });

    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
};

/**
 * Delete old notifications (cleanup)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {number} Number of notifications deleted
 */
export const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Deleted ${result.deletedCount} old notifications`);
    }

    return result.deletedCount;
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    return 0;
  }
};

// Helper function to create like notification
export const createLikeNotification = async (fromUserId, toUserId, postId) => {
  // Don't create notification if user likes their own post
  if (fromUserId === toUserId) return null;

  return await createNotification({
    type: "like",
    fromUserId,
    toUserId,
    postId,
    message: generateNotificationMessage("like"),
  });
};

// Helper function to create comment notification
export const createCommentNotification = async (
  fromUserId,
  toUserId,
  postId,
  commentId
) => {
  // Don't create notification if user comments on their own post
  if (fromUserId === toUserId) return null;

  return await createNotification({
    type: "comment",
    fromUserId,
    toUserId,
    postId,
    commentId,
    message: generateNotificationMessage("comment"),
  });
};

// Helper function to create follow notification
export const createFollowNotification = async (fromUserId, toUserId) => {
  return await createNotification({
    type: "follow",
    fromUserId,
    toUserId,
    message: generateNotificationMessage("follow"),
  });
};

// Helper function to create mention notification
export const createMentionNotification = async (
  fromUserId,
  toUserId,
  postId,
  commentId
) => {
  return await createNotification({
    type: "mention",
    fromUserId,
    toUserId,
    postId,
    commentId,
    message: generateNotificationMessage("mention"),
  });
};

export default Notification;
