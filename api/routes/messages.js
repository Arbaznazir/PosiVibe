import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount,
} from "../controllers/message.js";

const router = express.Router();

// Get unread message count (must be before /:userId)
router.get("/unread/count", getUnreadCount);

// Get conversations list
router.get("/", getConversations);

// Send a message
router.post("/", sendMessage);

// Get messages between two users (must be last)
router.get("/:userId", getMessages);

export default router;
