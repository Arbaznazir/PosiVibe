import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { adminAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all users with pagination and search
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", sort = "createdAt" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("verifiedBy", "name username");

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });

    const verificationStats = await User.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: "$verificationBadge", count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      bannedUsers,
      verifiedUsers,
      adminUsers,
      verificationStats: verificationStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Ban/unban user
router.put("/users/:id/ban", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, banReason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isBanned, banReason: isBanned ? banReason : "" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error updating user ban status:", err);
    res.status(500).json({ error: "Failed to update user ban status" });
  }
});

// Update user trust score
router.put("/users/:id/trust", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { trustScore, reason, violationType } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add to trust history
    user.trustHistory.push({
      score: trustScore,
      reason,
      violationType,
      timestamp: new Date(),
    });

    user.trustScore = trustScore;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error("Error updating trust score:", err);
    res.status(500).json({ error: "Failed to update trust score" });
  }
});

// Verify/unverify user
router.put("/users/:id/verify", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, verificationBadge, verificationReason } = req.body;
    const adminId = req.user.id;

    const user = await User.findByIdAndUpdate(
      id,
      {
        isVerified,
        verificationBadge: isVerified ? verificationBadge : "none",
        verificationReason: isVerified ? verificationReason : "",
        verifiedBy: isVerified ? adminId : null,
        verificationDate: isVerified ? new Date() : null,
      },
      { new: true }
    )
      .select("-password")
      .populate("verifiedBy", "name username");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error updating user verification:", err);
    res.status(500).json({ error: "Failed to update user verification" });
  }
});

// Get user details
router.get("/users/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select("-password")
      .populate("verifiedBy", "name username");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
