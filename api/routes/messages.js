import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount,
  clearMessageNotifications,
} from "../controllers/message.js";

const router = express.Router();

// Get unread message count (must be before /:userId)
router.get("/unread/count", getUnreadCount);

// Clear all message notifications
router.post("/clear-notifications", clearMessageNotifications);

// Get conversations list
router.get("/", getConversations);

// Send a message
router.post("/", sendMessage);

// Get messages between two users (must be last)
router.get("/:userId", getMessages);

export default router;
