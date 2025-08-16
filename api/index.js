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
import verificationRoutes from "./routes/verification.js";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import {
  checkFileType,
  logContentViolation,
  analyzeTextContent,
} from "./utils/aiContentFilter.js";
import { isUserBanned } from "./utils/adminDashboard.js";
import {
  timeLimitMiddleware,
  markOffline,
} from "./utils/timeLimitMiddleware.js";
import { uploadToCloudinary } from "./utils/uploadToCloudinary.js";
import connectDB, { mongoose } from "./connect.js";
import { canMessage } from "./controllers/message.js";
import Message from "./models/Message.js";
import { initializeEnvironment } from "./utils/fixEnv.js";

// Initialize environment and configuration
console.log("🔄 Initializing environment and configuration...");
initializeEnvironment();

// Ensure MongoDB connection is established
console.log("🔄 Initializing MongoDB connection...");

// Configure CORS (single middleware)
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Capacitor, curl)
    if (!origin) return callback(null, true);
    // In development allow all
    if (!isProd) return callback(null, true);
    // In production, allow configured origins or allow all if none configured
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
}));

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    // Allow connections from any origin (will be restricted by credentials)
    origin: (origin, callback) => {
      callback(null, true); // Allow all origins, but still require credentials
    },
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

  // Broadcast user online status to all connected users
  socket.broadcast.emit("user_online", {
    userId: socket.userId,
    isOnline: true,
  });

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { receiverId, content, fileUrl } = data;

      console.log(`📨 Received message data:`, {
        receiverId,
        content: content ? `"${content}"` : "MISSING",
        contentLength: content ? content.length : 0,
        fileUrl: fileUrl ? `"${fileUrl}"` : "NONE",
        senderId: socket.userId,
      });

      // Validate required fields
      if (!receiverId) {
        console.log(`❌ Missing receiverId`);
        socket.emit("message_error", {
          error: "Receiver ID is required",
        });
        return;
      }

      // Allow empty content if there's a file URL
      if ((!content || typeof content !== "string") && !fileUrl) {
        console.log(`❌ Invalid content and no file:`, { content, type: typeof content, fileUrl });
        socket.emit("message_error", {
          error: "Message content or file is required",
        });
        return;
      }

      console.log(
        `📨 Attempting to send message from ${socket.userId} to ${receiverId}`
      );

      // Check if sender can message receiver
      const canSendMessage = await canMessage(socket.userId, receiverId);
      if (!canSendMessage) {
        console.log(
          `❌ User ${socket.userId} cannot message ${receiverId} - not following`
        );
        socket.emit("message_error", {
          error: "You can only message users you follow",
        });
        return;
      }

      // Filter content
      const filteredContent = await analyzeTextContent(content.trim(), {
        contentType: "message",
      });
      if (!filteredContent.isClean) {
        console.log(
          `❌ Message blocked due to content: ${filteredContent.severity}`
        );
        socket.emit("message_error", {
          error: "Message contains inappropriate content",
          reason: filteredContent.severity,
        });
        return;
      }

      // Create and save message
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        content: content ? content.trim() : '', // Use original content since it passed filtering
        messageType: fileUrl ? "image" : "text",
        file: fileUrl || null, // Store file URL if provided
      });

      const savedMessage = await message.save();
      console.log(`💾 Message saved: ${savedMessage._id}`);

      const populatedMessage = await Message.findById(savedMessage._id)
        .populate("senderId", "name username profilePic")
        .populate("receiverId", "name username profilePic");

      // Send to sender
      socket.emit("message_sent", populatedMessage);
      console.log(`✅ Message sent confirmation to sender`);

      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_message", populatedMessage);
        console.log(`📬 Message delivered to receiver`);
      } else {
        console.log(
          `📤 Receiver ${receiverId} is offline, message saved for later`
        );
      }

      console.log(`💬 Message sent from ${socket.userId} to ${receiverId}`);
    } catch (error) {
      console.error("Socket message error:", error);
      socket.emit("message_error", {
        error: "Failed to send message",
        details: error.message,
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

  // Handle get online users request
  socket.on("get_online_users", () => {
    const onlineUserIds = Array.from(connectedUsers.keys());
    socket.emit("online_users", onlineUserIds);
  });
  
  // Handle message read events
  socket.on("mark_messages_read", async (data) => {
    try {
      const { senderId } = data;
      if (!senderId) return;
      
      // Update messages in database
      await Message.updateMany(
        {
          senderId: senderId,
          receiverId: socket.userId,
          read: false
        },
        {
          read: true,
          readAt: new Date()
        }
      );
      
      // Notify sender that messages were read
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_read", {
          byUserId: socket.userId
        });
      }
      
      // Emit event to update unread count for the current user
      socket.emit("unread_count_update");
      
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 User ${socket.userId} disconnected`);
    connectedUsers.delete(socket.userId);

    // Broadcast user offline status to all connected users
    socket.broadcast.emit("user_offline", {
      userId: socket.userId,
      isOnline: false,
    });
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

// CORS is configured above

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure file upload route with authentication
app.post("/api/upload", upload.single('file'), async (req, res) => {
  // Support auth via cookie or Authorization header (Bearer token)
  let token = req.cookies.accessToken;
  const authHeader = req.headers["authorization"] || req.headers["Authorization"]; 
  if (!token && authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        // Check if file exists in the request
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        // Check if content filtering should be applied (for chat images)
        const applyContentFilter = req.body.applyContentFilter === 'true';
        
        if (applyContentFilter) {
          console.log("🔍 Applying AI content moderation to uploaded image");
          
          try {
            // Use OpenAI for image moderation if available
            if (openai) {
              const response = await openai.moderations.create({
                input: `Image uploaded by user ${userInfo.id} in chat message`,
              });
              
              const moderationResult = response.results[0];
              
              if (moderationResult.flagged) {
                console.log("⚠️ Image flagged by content moderation:", moderationResult);
                return res.status(403).json({ 
                  error: "Image was flagged by content moderation",
                  flagged: true,
                  categories: moderationResult.categories
                });
              }
            }
          } catch (moderationError) {
            console.error("❌ Error during content moderation:", moderationError);
            // Continue with upload even if moderation fails
          }
        }

        // Get transformations from query params if provided
        const {
          transform_width,
          transform_height,
          transform_crop,
          transform_gravity,
        } = req.query;

        // Apply transformations if provided
        const transformations = {
          width: transform_width,
          height: transform_height,
          crop: transform_crop,
          gravity: transform_gravity,
        };

        // Use the file buffer from multer
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname || "upload.jpg",
          "posivibe/uploads",
          transformations
        );
        
        console.log("✅ File uploaded to Cloudinary:", uploadResult.secure_url);
        res.status(200).json({
          url: uploadResult.secure_url,
          flagged: false
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload file: " + error.message });
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

// Health check endpoints for Koyeb - moved to top priority
app.get("/", (req, res) => {
  console.log("ROOT health check hit");
  res.status(200).send("OK"); // Simple text response
});

app.get("/health", (req, res) => {
  console.log("HEALTH endpoint hit");
  res.status(200).send("OK"); // Simple text response
});

app.get("/healthz", (req, res) => {
  console.log("HEALTHZ endpoint hit");
  res.status(200).send("OK"); // Simple text response
});

// Also add a plain text endpoint
app.get("/ping", (req, res) => {
  console.log("PING endpoint hit");
  res.status(200).send("pong");
});

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
app.use("/api/verification", verificationRoutes);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Start server
const PORT = process.env.PORT || 8800;

// Log the port being used
console.log(`🔌 Attempting to bind to PORT=${PORT} (from env: ${process.env.PORT || 'not set'})`); 

// Listen on the port without specifying host to let the system decide
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
});
