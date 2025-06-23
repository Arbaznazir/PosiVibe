import express from "express";
import jwt from "jsonwebtoken";
import { getModerationDashboard } from "../utils/adminDashboard.js";

const router = express.Router();

// Simple admin authentication (in production, use proper role-based auth)
const adminMiddleware = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Simple admin check - in production, check user roles from database
    const adminUsers = ["2"]; // User ID 2 (arbaznazir4) is admin for demo
    if (!adminUsers.includes(userInfo.id)) {
      return res.status(403).json("Admin access required!");
    }

    req.userInfo = userInfo;
    next();
  });
};

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

export default router;
