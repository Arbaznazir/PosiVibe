import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Relationship from "../models/Relationship.js";
import User from "../models/User.js";
import { filterUserContent } from "../utils/aiContentFilter.js";

// Check if user can message another user (must follow them or have existing conversation)
export const canMessage = async (senderId, receiverId) => {
  try {
    // Allow messaging if sender follows receiver
    const relationship = await Relationship.findOne({
      followerUserId: senderId,
      followedUserId: receiverId,
    });

    if (relationship) {
      return true;
    }

    // Also allow messaging if they have an existing conversation
    const existingConversation = await Message.findOne({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    return !!existingConversation;
  } catch (error) {
    console.error("Error checking message permission:", error);
    return false;
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const { receiverId, content } = req.body;

        // Validate input
        if (!receiverId || !content?.trim()) {
          return res.status(400).json("Receiver ID and content are required");
        }

        // Validate ObjectIds
        if (
          !mongoose.Types.ObjectId.isValid(userInfo.id) ||
          !mongoose.Types.ObjectId.isValid(receiverId)
        ) {
          return res.status(400).json("Invalid user IDs");
        }

        // Check if sender can message receiver (must follow them)
        const canSendMessage = await canMessage(userInfo.id, receiverId);
        if (!canSendMessage) {
          return res.status(403).json("You can only message users you follow");
        }

        // Filter content for inappropriate material (temporarily disabled for testing)
        const filteredContent = {
          content: content.trim(),
          blocked: false,
        };
        // const filteredContent = await filterUserContent(
        //   content.trim(),
        //   "message"
        // );
        // if (filteredContent.blocked) {
        //   return res.status(400).json({
        //     message: "Message contains inappropriate content",
        //     reason: filteredContent.reason,
        //   });
        // }

        // Create message
        const message = new Message({
          senderId: userInfo.id,
          receiverId,
          content: filteredContent.content,
          messageType: "text",
        });

        const savedMessage = await message.save();

        // Populate sender info for response
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate("senderId", "name username profilePic")
          .populate("receiverId", "name username profilePic");

        res.status(200).json(populatedMessage);
      } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json("Internal server error");
      }
    }
  );
};

// Get messages between two users
export const getMessages = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Validate ObjectIds
        if (
          !mongoose.Types.ObjectId.isValid(userInfo.id) ||
          !mongoose.Types.ObjectId.isValid(userId)
        ) {
          return res.status(400).json("Invalid user IDs");
        }

        // Check if user can view messages (must follow each other)
        const canView = await canMessage(userInfo.id, userId);
        if (!canView) {
          return res
            .status(403)
            .json("You can only view messages with users you follow");
        }

        // Get messages between users
        const messages = await Message.find({
          $or: [
            { senderId: userInfo.id, receiverId: userId },
            { senderId: userId, receiverId: userInfo.id },
          ],
        })
          .populate("senderId", "name username profilePic")
          .populate("receiverId", "name username profilePic")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        // Mark messages as read
        await Message.updateMany(
          {
            senderId: userId,
            receiverId: userInfo.id,
            read: false,
          },
          {
            read: true,
            readAt: new Date(),
          }
        );

        res.status(200).json(messages.reverse()); // Reverse to show oldest first
      } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json("Internal server error");
      }
    }
  );
};

// Get conversations list
export const getConversations = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        // Get all users the current user follows
        const following = await Relationship.find({
          followerUserId: userInfo.id,
        })
          .populate("followedUserId", "name username profilePic")
          .sort({ createdAt: -1 });

        // Get last message with each followed user
        const conversations = await Promise.all(
          following.map(async (relationship) => {
            const lastMessage = await Message.findOne({
              $or: [
                {
                  senderId: userInfo.id,
                  receiverId: relationship.followedUserId._id,
                },
                {
                  senderId: relationship.followedUserId._id,
                  receiverId: userInfo.id,
                },
              ],
            })
              .sort({ createdAt: -1 })
              .populate("senderId", "name username profilePic");

            // Count unread messages from this user
            const unreadCount = await Message.countDocuments({
              senderId: relationship.followedUserId._id,
              receiverId: userInfo.id,
              read: false,
            });

            return {
              user: relationship.followedUserId,
              lastMessage,
              count: unreadCount,
              updatedAt: lastMessage
                ? lastMessage.createdAt
                : relationship.createdAt,
            };
          })
        );

        // Sort by last message date
        conversations.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        res.status(200).json(conversations);
      } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json("Internal server error");
      }
    }
  );
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const unreadCount = await Message.countDocuments({
          receiverId: userInfo.id,
          read: false,
        });

        res.status(200).json({ count: unreadCount });
      } catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json("Internal server error");
      }
    }
  );
};
