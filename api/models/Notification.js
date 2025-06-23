// Notification model for tracking user interactions
// Types: like, comment, follow, mention, post

let notifications = [];
let notificationIdCounter = 1;

// Mock users data for reference
const users = [
  {
    _id: "1",
    id: "1",
    username: "testuser",
    email: "test@example.com",
    name: "Test User",
    profilePic: null,
  },
  {
    _id: "2",
    id: "2",
    username: "arbaznazir4",
    email: "arbaznazir4@gmail.com",
    name: "Arbaz Nazir",
    profilePic: null,
  },
  {
    _id: "3",
    id: "3",
    username: "johndoe",
    email: "john@example.com",
    name: "John Doe",
    profilePic: "/upload/1675950730470Facebook-Cover-Photos-13.png",
  },
  {
    _id: "4",
    id: "4",
    username: "janedoe",
    email: "jane@example.com",
    name: "Jane Doe",
    profilePic: "/upload/1675950944762profile2.jpg",
  },
];

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Object} The created notification
 */
export const createNotification = (notificationData) => {
  const notification = {
    id: notificationIdCounter++,
    type: notificationData.type, // 'like', 'comment', 'follow', 'mention', 'post'
    fromUserId: notificationData.fromUserId,
    toUserId: notificationData.toUserId,
    postId: notificationData.postId || null,
    commentId: notificationData.commentId || null,
    message: notificationData.message,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.push(notification);
  console.log(
    `📧 New notification created: ${notification.type} from user ${notification.fromUserId} to user ${notification.toUserId}`
  );

  return notification;
};

/**
 * Get notifications for a specific user
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Array} Array of notifications with user details
 */
export const getNotificationsForUser = (userId, limit = 20) => {
  const userNotifications = notifications
    .filter((notification) => notification.toUserId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  // Add user details to notifications
  return userNotifications.map((notification) => {
    const fromUser = users.find(
      (u) =>
        u.id === notification.fromUserId || u._id === notification.fromUserId
    );

    return {
      ...notification,
      fromUser: fromUser
        ? {
            id: fromUser.id || fromUser._id,
            name: fromUser.name,
            username: fromUser.username,
            profilePic: fromUser.profilePic,
          }
        : null,
    };
  });
};

/**
 * Mark notification as read
 * @param {number} notificationId - The notification ID
 * @param {string} userId - The user ID (for security)
 * @returns {boolean} Success status
 */
export const markNotificationAsRead = (notificationId, userId) => {
  const notification = notifications.find(
    (n) => n.id === notificationId && n.toUserId === userId
  );

  if (notification) {
    notification.read = true;
    return true;
  }

  return false;
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 * @returns {number} Number of notifications marked as read
 */
export const markAllNotificationsAsRead = (userId) => {
  let count = 0;

  notifications.forEach((notification) => {
    if (notification.toUserId === userId && !notification.read) {
      notification.read = true;
      count++;
    }
  });

  return count;
};

/**
 * Get unread notification count for a user
 * @param {string} userId - The user ID
 * @returns {number} Number of unread notifications
 */
export const getUnreadNotificationCount = (userId) => {
  return notifications.filter(
    (notification) => notification.toUserId === userId && !notification.read
  ).length;
};

/**
 * Delete old notifications (cleanup)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {number} Number of notifications deleted
 */
export const deleteOldNotifications = (daysOld = 30) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const originalLength = notifications.length;

  notifications = notifications.filter(
    (notification) => new Date(notification.createdAt) >= cutoffDate
  );

  const deletedCount = originalLength - notifications.length;

  if (deletedCount > 0) {
    console.log(`🧹 Deleted ${deletedCount} old notifications`);
  }

  return deletedCount;
};

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

// Helper function to create like notification
export const createLikeNotification = (fromUserId, toUserId, postId) => {
  // Don't create notification if user likes their own post
  if (fromUserId === toUserId) return null;

  return createNotification({
    type: "like",
    fromUserId,
    toUserId,
    postId,
    message: generateNotificationMessage("like"),
  });
};

// Helper function to create comment notification
export const createCommentNotification = (
  fromUserId,
  toUserId,
  postId,
  commentId
) => {
  // Don't create notification if user comments on their own post
  if (fromUserId === toUserId) return null;

  return createNotification({
    type: "comment",
    fromUserId,
    toUserId,
    postId,
    commentId,
    message: generateNotificationMessage("comment"),
  });
};

// Helper function to create follow notification
export const createFollowNotification = (fromUserId, toUserId) => {
  return createNotification({
    type: "follow",
    fromUserId,
    toUserId,
    message: generateNotificationMessage("follow"),
  });
};

// Helper function to create mention notification
export const createMentionNotification = (
  fromUserId,
  toUserId,
  postId,
  commentId
) => {
  return createNotification({
    type: "mention",
    fromUserId,
    toUserId,
    postId,
    commentId,
    message: generateNotificationMessage("mention"),
  });
};

// Export all notifications for debugging
export const getAllNotifications = () => notifications;

// Initialize with some sample notifications for testing
const initializeSampleNotifications = () => {
  // Sample notifications for user 2 (current user in most cases)
  createLikeNotification("1", "2", "1");
  createCommentNotification("3", "2", "2", "1");
  createFollowNotification("1", "2");
  createLikeNotification("4", "2", "3");
  createCommentNotification("1", "2", "4", "2");

  console.log("📧 Sample notifications initialized");
};

// Initialize sample data
initializeSampleNotifications();

export default {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteOldNotifications,
  generateNotificationMessage,
  createLikeNotification,
  createCommentNotification,
  createFollowNotification,
  createMentionNotification,
  getAllNotifications,
};
