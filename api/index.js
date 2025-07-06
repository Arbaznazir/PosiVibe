import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
const app = express();
const server = createServer(app);
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import commentRoutes from "./routes/comments.js";
import likeRoutes from "./routes/likes.js";
import storyRoutes from "./routes/stories.js";
import relationshipRoutes from "./routes/relationships.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import messageRoutes from "./routes/messages.js";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { checkFileType, logContentViolation } from "./utils/aiContentFilter.js";
import { isUserBanned } from "./utils/adminDashboard.js";
import {
  timeLimitMiddleware,
  markOffline,
} from "./utils/timeLimitMiddleware.js";
import { uploadToCloudinary } from "./utils/uploadToCloudinary.js";
import { mongoose } from "./connect.js";
import { canMessage } from "./controllers/message.js";
import { filterUserContent } from "./utils/aiContentFilter.js";
import Message from "./models/Message.js";

// MongoDB connection is handled in connect.js

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, userInfo) => {
    if (err) {
      return next(new Error("Authentication error"));
    }
    socket.userId = userInfo.id;
    next();
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 User ${socket.userId} connected`);

  // Store user connection
  connectedUsers.set(socket.userId, socket.id);

  // Join user to their own room
  socket.join(socket.userId);

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { receiverId, content } = data;

      // Check if sender can message receiver
      const canSendMessage = await canMessage(socket.userId, receiverId);
      if (!canSendMessage) {
        socket.emit("message_error", {
          error: "You can only message users you follow",
        });
        return;
      }

      // Filter content
      const filteredContent = await filterUserContent(
        content.trim(),
        "message"
      );
      if (filteredContent.blocked) {
        socket.emit("message_error", {
          error: "Message contains inappropriate content",
          reason: filteredContent.reason,
        });
        return;
      }

      // Create and save message
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        content: filteredContent.content,
        messageType: "text",
      });

      const savedMessage = await message.save();
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate("senderId", "name username profilePic")
        .populate("receiverId", "name username profilePic");

      // Send to sender
      socket.emit("message_sent", populatedMessage);

      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_message", populatedMessage);
      }

      console.log(`💬 Message sent from ${socket.userId} to ${receiverId}`);
    } catch (error) {
      console.error("Socket message error:", error);
      socket.emit("message_error", {
        error: "Failed to send message",
      });
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { receiverId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_typing", {
        userId: socket.userId,
      });
    }
  });

  socket.on("stop_typing", (data) => {
    const { receiverId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_stop_typing", {
        userId: socket.userId,
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 User ${socket.userId} disconnected`);
    connectedUsers.delete(socket.userId);
  });
});

//middlewares
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

// Configure express to handle file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configure CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

app.use(cookieParser());

// Configure file upload route with authentication
app.post("/api/upload", async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const {
          file,
          transform_width,
          transform_height,
          transform_crop,
          transform_gravity,
        } = req.body;

        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }

        // Apply transformations if provided
        const transformations = {
          width: transform_width,
          height: transform_height,
          crop: transform_crop,
          gravity: transform_gravity,
        };

        const uploadedUrl = await uploadToCloudinary(file, transformations);
        res.status(200).json(uploadedUrl);
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", {
    error: err.message,
    stack: err.stack,
    type: err.type,
    status: err.status,
  });

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request entity too large" });
  }
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ message: `File upload error: ${err.message}` });
  }
  next(err);
});

// Ban checking middleware for protected routes
const banCheckMiddleware = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return next(); // Let individual routes handle auth

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, userInfo) => {
    if (err) return next(); // Let individual routes handle invalid tokens

    if (isUserBanned(userInfo.id)) {
      return res.status(403).json({
        error: "Account suspended",
        message:
          "Your account has been suspended due to violations of our community guidelines. Please contact support if you believe this is an error.",
      });
    }
    next();
  });
};

// Apply ban check to all protected routes
app.use(
  ["/api/posts", "/api/comments", "/api/likes", "/api/stories"],
  banCheckMiddleware
);

// Apply time limit middleware to all protected routes
app.use(
  ["/api/posts", "/api/comments", "/api/likes", "/api/stories"],
  timeLimitMiddleware
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Start server
const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
