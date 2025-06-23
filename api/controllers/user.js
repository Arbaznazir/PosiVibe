import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import {
  filterUserContent,
  logContentViolation,
} from "../utils/contentFilter.js";
import User from "../models/User.js";
import Relationship from "../models/Relationship.js";

// Mock time limit data storage
let userTimeLimits = {};

// Function to track and get user's time limit info
const getUserTimeLimit = (userId) => {
  const now = new Date();
  const today = now.toDateString();

  // Initialize user time limit if not exists
  if (!userTimeLimits[userId]) {
    userTimeLimits[userId] = {
      timeSpentToday: 0,
      lastReset: today,
      lastActive: now,
      sessionStart: now,
    };
  }

  const userLimit = userTimeLimits[userId];

  // Reset if it's a new day
  if (userLimit.lastReset !== today) {
    userLimit.timeSpentToday = 0;
    userLimit.lastReset = today;
    userLimit.sessionStart = now;
  }

  // Calculate time spent in current session
  const sessionTime = now - new Date(userLimit.sessionStart);

  // Add session time to total time spent today
  userLimit.timeSpentToday += sessionTime;
  userLimit.sessionStart = now; // Reset session start

  // Update last active
  userLimit.lastActive = now;

  const DAILY_LIMIT = 2.5 * 60 * 60 * 1000; // 2.5 hours in milliseconds
  const remaining = Math.max(0, DAILY_LIMIT - userLimit.timeSpentToday);

  // Calculate next reset time (midnight)
  const resetTime = new Date();
  resetTime.setDate(resetTime.getDate() + 1);
  resetTime.setHours(0, 0, 0, 0);

  console.log(`⏰ User ${userId} time tracking:`, {
    timeSpentToday: Math.floor(userLimit.timeSpentToday / 1000 / 60), // in minutes
    remainingMinutes: Math.floor(remaining / 1000 / 60),
    sessionTimeSeconds: Math.floor(sessionTime / 1000),
  });

  return {
    remaining,
    dailyLimit: DAILY_LIMIT,
    resetTime: resetTime.toISOString(),
    timeSpentToday: userLimit.timeSpentToday,
  };
};

export const getUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json("User not found!");
    }

    return res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json("Failed to get user");
  }
};

export const searchUsers = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const query = req.query.q?.toLowerCase() || "";
        const currentUserId = userInfo.id;

        if (!query.trim()) {
          return res.json([]);
        }

        // Search users in database (exclude current user)
        const matchingUsers = await User.find({
          _id: { $ne: currentUserId },
          $or: [
            { name: { $regex: query, $options: "i" } },
            { username: { $regex: query, $options: "i" } },
          ],
        })
          .select("-password")
          .limit(20);

        // Get current user's following relationships
        const followingRelationships = await Relationship.find({
          followerUserId: currentUserId,
        });

        const followingIds = followingRelationships.map((rel) =>
          rel.followedUserId.toString()
        );

        // Add follow status to each user
        const usersWithFollowStatus = matchingUsers.map((user) => {
          const userObj = user.toObject();
          userObj.isFollowing = followingIds.includes(user._id.toString());
          return userObj;
        });

        // Smart ranking algorithm
        const rankedResults = usersWithFollowStatus.sort((a, b) => {
          // 1. Exact name matches first
          const aNameExact = a.name.toLowerCase() === query;
          const bNameExact = b.name.toLowerCase() === query;
          if (aNameExact && !bNameExact) return -1;
          if (!aNameExact && bNameExact) return 1;

          // 2. Exact username matches
          const aUsernameExact = a.username.toLowerCase() === query;
          const bUsernameExact = b.username.toLowerCase() === query;
          if (aUsernameExact && !bUsernameExact) return -1;
          if (!aUsernameExact && bUsernameExact) return 1;

          // 3. Following status (followed users first)
          if (a.isFollowing && !b.isFollowing) return -1;
          if (!a.isFollowing && b.isFollowing) return 1;

          // 4. Name starts with query
          const aNameStarts = a.name.toLowerCase().startsWith(query);
          const bNameStarts = b.name.toLowerCase().startsWith(query);
          if (aNameStarts && !bNameStarts) return -1;
          if (!aNameStarts && bNameStarts) return 1;

          // 5. Username starts with query
          const aUsernameStarts = a.username.toLowerCase().startsWith(query);
          const bUsernameStarts = b.username.toLowerCase().startsWith(query);
          if (aUsernameStarts && !bUsernameStarts) return -1;
          if (!aUsernameStarts && bUsernameStarts) return 1;

          // 6. Alphabetical order
          return a.name.localeCompare(b.name);
        });

        return res.json(rankedResults.slice(0, 8)); // Limit to 8 results
      } catch (err) {
        console.error("Search users error:", err);
        return res.status(500).json("Search failed");
      }
    }
  );
};

export const updateUser = async (req, res) => {
  const token = req.cookies.accessToken;
  console.log("🔐 Update user request - Token exists:", !!token);
  console.log("📝 Update user request body:", req.body);

  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) {
        console.error("❌ JWT verification failed:", err.message);
        return res.status(403).json("Token is not valid!");
      }

      console.log("✅ JWT verified for user:", userInfo.id);

      try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
          return res.status(400).json("Invalid user ID");
        }
        // 🚫 CONTENT FILTERATION - Only filter names and usernames, not location/website
        // Create a filtered object with only the fields we want to check
        const fieldsToFilter = {};
        if (req.body.name) fieldsToFilter.name = req.body.name;
        if (req.body.username) fieldsToFilter.username = req.body.username;

        // Only run content filter if we have fields that need filtering
        if (Object.keys(fieldsToFilter).length > 0) {
          const filterResult = await filterUserContent(fieldsToFilter);
          if (!filterResult.isClean) {
            // Log the violation
            logContentViolation(
              "user_profile",
              userInfo.id,
              filterResult,
              fieldsToFilter
            );

            return res.status(400).json({
              error: "Content not allowed",
              reason: filterResult.reason,
              message:
                "Your profile name contains content that violates our community guidelines. Please choose a different name.",
            });
          }
        }

        const user = await User.findById(userInfo.id);

        if (!user) {
          return res.status(403).json("You can update only your profile!");
        }

        // Update user data
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.city) updateData.city = req.body.city;
        if (req.body.website) updateData.website = req.body.website;
        if (req.body.profilePic !== undefined)
          updateData.profilePic = req.body.profilePic;
        if (req.body.coverPic !== undefined)
          updateData.coverPic = req.body.coverPic;

        // Hash password if provided
        if (req.body.password && req.body.password.trim()) {
          const salt = bcryptjs.genSaltSync(10);
          const hashedPassword = bcryptjs.hashSync(req.body.password, salt);
          updateData.password = hashedPassword;
        }

        console.log("📝 Updating user profile with data:", updateData);

        const updatedUser = await User.findByIdAndUpdate(
          userInfo.id,
          updateData,
          { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
          return res.status(404).json("User not found");
        }

        console.log(
          "✅ User profile updated successfully:",
          updatedUser.username
        );
        return res.json({
          message: "Updated!",
          user: updatedUser,
        });
      } catch (err) {
        console.error("❌ Update user error:", err);

        // Handle specific MongoDB validation errors
        if (err.name === "ValidationError") {
          const errors = Object.values(err.errors).map((e) => e.message);
          console.error("Validation errors:", errors);
          return res.status(400).json({
            error: "Validation failed",
            message: errors.join(", "),
          });
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
          const field = Object.keys(err.keyPattern)[0];
          console.error("Duplicate key error:", field);
          return res.status(400).json({
            error: "Duplicate value",
            message: `${field} already exists`,
          });
        }

        return res.status(500).json({
          error: "Update failed",
          message: err.message || "Internal server error",
        });
      }
    }
  );
};

export const getTimeLimit = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const timeLimit = getUserTimeLimit(userInfo.id);

        // Format the remaining time in user-friendly format
        const hours = Math.floor(timeLimit.remaining / (60 * 60 * 1000));
        const minutes = Math.floor(
          (timeLimit.remaining % (60 * 60 * 1000)) / (60 * 1000)
        );
        const seconds = Math.floor((timeLimit.remaining % (60 * 1000)) / 1000);

        let formattedTimeRemaining;
        if (hours > 0) {
          formattedTimeRemaining = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          formattedTimeRemaining = `${minutes}m`;
        } else {
          formattedTimeRemaining = `${seconds}s`;
        }

        // Check if time limit exceeded
        const isTimeUp = timeLimit.remaining <= 0;

        return res.json({
          remaining: timeLimit.remaining,
          formattedTimeRemaining,
          dailyLimit: timeLimit.dailyLimit,
          resetTime: timeLimit.resetTime,
          timeSpentToday: timeLimit.timeSpentToday,
          isTimeUp,
        });
      } catch (err) {
        console.error("Get time limit error:", err);
        return res.status(500).json("Failed to get time limit");
      }
    }
  );
};

// Test endpoint to simulate time usage (for testing purposes)
export const simulateTimeUsage = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const { minutes } = req.body;
        const timeToAdd = (minutes || 30) * 60 * 1000; // Convert minutes to milliseconds

        // Initialize user if not exists
        if (!userTimeLimits[userInfo.id]) {
          const now = new Date();
          userTimeLimits[userInfo.id] = {
            timeSpentToday: 0,
            lastReset: now.toDateString(),
            lastActive: now,
            sessionStart: now,
          };
        }

        // Add time to user's usage
        userTimeLimits[userInfo.id].timeSpentToday += timeToAdd;

        console.log(
          `⚡ Simulated ${minutes || 30} minutes of usage for user ${
            userInfo.id
          }`
        );

        // Get updated time info
        const timeLimit = getUserTimeLimit(userInfo.id);

        return res.json({
          message: `Added ${minutes || 30} minutes to usage`,
          timeSpentToday: Math.floor(timeLimit.timeSpentToday / 1000 / 60), // in minutes
          remaining: Math.floor(timeLimit.remaining / 1000 / 60), // in minutes
          isTimeUp: timeLimit.remaining <= 0,
        });
      } catch (err) {
        console.error("Simulate time usage error:", err);
        return res.status(500).json("Failed to simulate time usage");
      }
    }
  );
};
