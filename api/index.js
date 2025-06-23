import express from "express";
const app = express();
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import commentRoutes from "./routes/comments.js";
import likeRoutes from "./routes/likes.js";
import storyRoutes from "./routes/stories.js";
import relationshipRoutes from "./routes/relationships.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import {
  filterImageFilename,
  checkFileType,
  logContentViolation,
} from "./utils/contentFilter.js";
import { isUserBanned } from "./utils/adminDashboard.js";
import {
  timeLimitMiddleware,
  markOffline,
} from "./utils/timeLimitMiddleware.js";
import { uploadToCloudinary } from "./utils/uploadToCloudinary.js";
import connectDB from "./config/database.js";

// Connect to MongoDB Atlas
connectDB();

//middlewares
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(cookieParser());

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

// Configure multer for memory storage (Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // 🚫 CONTENT FILTERATION - Check file type and filename
    const fileTypeCheck = checkFileType(file.originalname);
    if (!fileTypeCheck.isAllowed) {
      console.warn("🚫 File upload blocked:", fileTypeCheck.reason);
      return cb(new Error(fileTypeCheck.reason), false);
    }

    const filenameCheck = filterImageFilename(file.originalname);
    if (!filenameCheck.isClean) {
      console.warn("🚫 File upload blocked:", filenameCheck.reason);
      logContentViolation(
        "file_upload",
        req.user?.id || "unknown",
        filenameCheck,
        { filename: file.originalname }
      );
      return cb(new Error(filenameCheck.reason), false);
    }

    cb(null, true);
  },
});

app.post(
  "/api/upload",
  banCheckMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        "posivibe"
      );

      console.log(
        "✅ File uploaded successfully to Cloudinary:",
        cloudinaryResult.public_id
      );

      // Return the secure URL for the frontend to use
      res.status(200).json({
        url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(400).json({
        error: "Upload failed",
        message: error.message,
      });
    }
  }
);

// Error handling for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "File size must be less than 10MB",
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      error: "File upload failed",
      message: error.message,
    });
  }

  next(error);
});

// Add these lines after other middleware setup but before routes
app.use(timeLimitMiddleware);
app.use("/api/auth/logout", markOffline);

// Clear session endpoint for debugging
app.post("/api/clear-session", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  console.log("🧹 Session cleared for debugging");
  res.json({ message: "Session cleared" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", banCheckMiddleware, userRoutes);
app.use("/api/posts", banCheckMiddleware, postRoutes);
app.use("/api/comments", banCheckMiddleware, commentRoutes);
app.use("/api/likes", banCheckMiddleware, likeRoutes);
app.use("/api/relationships", banCheckMiddleware, relationshipRoutes);
app.use("/api/stories", banCheckMiddleware, storyRoutes);
app.use("/api/notifications", banCheckMiddleware, notificationRoutes);
app.use("/api/admin", adminRoutes);

app.listen(8800, () => {
  console.log("API working!");
  console.log(
    "🛡️ Content filteration system active - blocking inappropriate content"
  );
  console.log(
    "🔨 User ban system active - suspended users cannot access protected routes"
  );
  console.log("👮 Admin dashboard available at /api/admin/dashboard");
});
