import jwt from "jsonwebtoken";
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
} from "../models/Notification.js";

/**
 * Get notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const limit = parseInt(req.query.limit) || 20;
        const notifications = await getNotificationsForUser(userInfo.id, limit);

        return res.json(notifications);
      } catch (err) {
        console.error("Get notifications error:", err);
        return res.status(500).json("Failed to get notifications");
      }
    }
  );
};

/**
 * Get unread notification count for the authenticated user
 */
export const getUnreadCount = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const count = await getUnreadNotificationCount(userInfo.id);
        return res.json({ count });
      } catch (err) {
        console.error("Get unread count error:", err);
        return res.status(500).json("Failed to get unread count");
      }
    }
  );
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const notificationId = req.params.id;
        const success = await markNotificationAsRead(
          notificationId,
          userInfo.id
        );

        if (success) {
          return res.json({ message: "Notification marked as read" });
        } else {
          return res.status(404).json("Notification not found");
        }
      } catch (err) {
        console.error("Mark as read error:", err);
        return res.status(500).json("Failed to mark notification as read");
      }
    }
  );
};

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllAsRead = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const count = await markAllNotificationsAsRead(userInfo.id);
        return res.json({
          message: `Marked ${count} notifications as read`,
          count,
        });
      } catch (err) {
        console.error("Mark all as read error:", err);
        return res.status(500).json("Failed to mark all notifications as read");
      }
    }
  );
};

/**
 * Delete a specific notification for the authenticated user
 */
export const deleteNotificationById = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const notificationId = req.params.id;
        const success = await deleteNotification(notificationId, userInfo.id);

        if (success) {
          return res.json({ message: "Notification deleted successfully" });
        } else {
          return res.status(404).json("Notification not found");
        }
      } catch (err) {
        console.error("Delete notification error:", err);
        return res.status(500).json("Failed to delete notification");
      }
    }
  );
};
