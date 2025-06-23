import UserTimeLimit from "../models/UserTimeLimit.js";
import jwt from "jsonwebtoken";

// Time limit constants
const DAILY_LIMIT = 2.5 * 60 * 60 * 1000; // 2.5 hours in milliseconds
const UPDATE_INTERVAL = 30 * 1000; // Update time every 30 seconds
const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity before marking offline

// Cache for last update times to prevent too frequent DB updates
const lastUpdates = new Map();

export const timeLimitMiddleware = async (req, res, next) => {
  try {
    // Skip time tracking for non-authenticated routes and non-GET/POST requests
    if (
      !req.headers.authorization ||
      (req.method !== "GET" && req.method !== "POST")
    ) {
      return next();
    }

    // Skip time tracking for specific endpoints
    const skipPaths = ["/api/auth/logout", "/api/users/timelimit"];
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    // Get or create time limit record
    let timeLimit = await UserTimeLimit.findOne({ userId });
    if (!timeLimit) {
      timeLimit = new UserTimeLimit({ userId });
      await timeLimit.save();
    }

    // Check if we should reset the daily timer
    if (timeLimit.shouldResetTime()) {
      timeLimit.timeSpentToday = 0;
      timeLimit.lastReset = new Date();
      await timeLimit.save();
    }

    // Check if user was inactive
    const now = Date.now();
    const timeSinceLastActive = now - timeLimit.lastActive.getTime();
    if (timeSinceLastActive >= INACTIVE_TIMEOUT) {
      timeLimit.isOnline = false;
      await timeLimit.save();
    }

    // Update time spent if enough time has passed since last update
    const lastUpdate = lastUpdates.get(userId) || 0;

    if (now - lastUpdate >= UPDATE_INTERVAL) {
      // Only count time if user was marked as online
      const timeToAdd = timeLimit.isOnline
        ? Math.min(timeSinceLastActive, UPDATE_INTERVAL)
        : UPDATE_INTERVAL;

      const newTimeSpent = Math.min(
        DAILY_LIMIT,
        timeLimit.timeSpentToday + timeToAdd
      );

      timeLimit.timeSpentToday = newTimeSpent;
      timeLimit.lastActive = now;
      timeLimit.isOnline = true;
      await timeLimit.save();
      lastUpdates.set(userId, now);

      // If time limit exceeded, send error response
      if (newTimeSpent >= DAILY_LIMIT) {
        return res.status(403).json({
          error: "Daily time limit exceeded",
          timeSpent: newTimeSpent,
          timeLimit: DAILY_LIMIT,
          remainingTime: 0,
        });
      }
    }

    // Add time info to request for use in routes
    req.timeLimit = {
      timeSpent: timeLimit.timeSpentToday,
      remaining: timeLimit.getRemainingTime(),
      isOnline: timeLimit.isOnline,
      lastActive: timeLimit.lastActive,
    };

    next();
  } catch (error) {
    console.error("Time limit middleware error:", error);
    // Don't block the request on time tracking errors
    next();
  }
};

// Middleware to mark user as offline
export const markOffline = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.id;

      const timeLimit = await UserTimeLimit.findOne({ userId });
      if (timeLimit) {
        timeLimit.isOnline = false;
        await timeLimit.save();
      }
    }
    next();
  } catch (error) {
    console.error("Mark offline error:", error);
    next();
  }
};
