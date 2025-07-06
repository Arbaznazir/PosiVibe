import express from "express";
import jwt from "jsonwebtoken";
import {
  getModerationDashboard,
  banUser,
  unbanUser,
  flagUser,
  unflagUser,
} from "../utils/adminDashboard.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Simple admin authentication (in production, use proper role-based auth)
const adminMiddleware = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (!decoded) return res.status(403).json("Token is not valid!");

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json("User not found!");

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json("Admin access required!");
    }

    req.userInfo = decoded;
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(403).json("Token is not valid!");
  }
};

// Setup admin endpoint - only accessible in development
router.post("/setup-admin", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Not allowed in production" });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@posivibe.com" });
    if (existingAdmin) {
      // Update admin privileges if needed
      if (!existingAdmin.isAdmin) {
        await User.updateOne(
          { email: "admin@posivibe.com" },
          { $set: { isAdmin: true } }
        );
        return res.json({ message: "Updated existing user to admin" });
      } else {
        return res.json({ message: "Admin user already exists" });
      }
    }

    // Create admin user
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("admin123", salt);

    const adminUser = new User({
      username: "admin",
      email: "admin@posivibe.com",
      password: hashedPassword,
      name: "PosiVibe Admin",
      isAdmin: true,
    });

    await adminUser.save();
    res.json({ message: "Admin user created successfully" });
  } catch (error) {
    console.error("Error setting up admin:", error);
    res.status(500).json({ error: "Failed to setup admin" });
  }
});

// Get moderation dashboard
router.get("/dashboard", adminMiddleware, (req, res) => {
  try {
    const dashboard = getModerationDashboard();
    res.status(200).json(dashboard);
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json("Failed to load dashboard");
  }
});

// Get content violation statistics
router.get("/stats", adminMiddleware, (req, res) => {
  try {
    const dashboard = getModerationDashboard();
    res.status(200).json(dashboard.stats);
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json("Failed to load stats");
  }
});

// Ban a user
router.post("/users/:userId/ban", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found");
    }

    banUser(userId, reason, req.userInfo.id);
    await User.findByIdAndUpdate(userId, { isBanned: true });

    res.status(200).json("User banned successfully");
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json("Failed to ban user");
  }
});

// Unban a user
router.post("/users/:userId/unban", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found");
    }

    unbanUser(userId, req.userInfo.id);
    await User.findByIdAndUpdate(userId, { isBanned: false });

    res.status(200).json("User unbanned successfully");
  } catch (err) {
    console.error("Unban user error:", err);
    res.status(500).json("Failed to unban user");
  }
});

// Flag a user for review
router.post("/users/:userId/flag", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found");
    }

    flagUser(userId, reason);
    res.status(200).json("User flagged for review");
  } catch (err) {
    console.error("Flag user error:", err);
    res.status(500).json("Failed to flag user");
  }
});

// Remove flag from user
router.post("/users/:userId/unflag", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found");
    }

    unflagUser(userId);
    res.status(200).json("Flag removed from user");
  } catch (err) {
    console.error("Unflag user error:", err);
    res.status(500).json("Failed to remove flag");
  }
});

// Get all users (with pagination)
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("username name email profilePic isBanned createdAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.status(200).json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json("Failed to get users");
  }
});

export default router;
