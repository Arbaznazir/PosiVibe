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
    if (req.method !== "GET" && req.method !== "POST") {
      return next();
    }

    // Skip time tracking for specific endpoints
    const skipPaths = ["/api/auth/logout", "/api/users/timelimit"];
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Get token from either cookies or Authorization header
    let token = req.cookies.accessToken;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Skip if no token found
    if (!token) {
      return next();
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    // Get or create time limit record
    let timeLimit = await UserTimeLimit.findOne({ userId });
    if (!timeLimit) {
      timeLimit = new UserTimeLimit({ userId });
      await timeLimit.save();
    }

    // Check if we should reset the daily timer (only at actual midnight, not on login)
    const now = new Date();
    const lastReset = new Date(timeLimit.lastReset);
    const shouldReset = timeLimit.shouldResetTime();

    if (shouldReset) {
      console.log(
        `⏰ Daily reset for user ${userId}: ${timeLimit.timeSpentToday}ms -> 0ms`
      );
      timeLimit.timeSpentToday = 0;
      timeLimit.lastReset = now;
      await timeLimit.save();
    }

    // Check if user was inactive for too long
    const timeSinceLastActive = now.getTime() - timeLimit.lastActive.getTime();
    const wasInactive = timeSinceLastActive >= INACTIVE_TIMEOUT;

    if (wasInactive && timeLimit.isOnline) {
      timeLimit.isOnline = false;
      await timeLimit.save();
    }

    // Update time spent if enough time has passed since last update
    const lastUpdate = lastUpdates.get(userId) || 0;
    const timeSinceLastUpdate = now.getTime() - lastUpdate;

    if (timeSinceLastUpdate >= UPDATE_INTERVAL) {
      // Only count active time (when user was marked as online and not inactive)
      let timeToAdd = 0;

      if (timeLimit.isOnline && !wasInactive) {
        // Add the actual time since last update, capped at UPDATE_INTERVAL
        timeToAdd = Math.min(timeSinceLastUpdate, UPDATE_INTERVAL);
      } else {
        // User was offline or inactive, only add the current update interval
        timeToAdd = UPDATE_INTERVAL;
      }

      const newTimeSpent = Math.min(
        DAILY_LIMIT,
        timeLimit.timeSpentToday + timeToAdd
      );

      timeLimit.timeSpentToday = newTimeSpent;
      timeLimit.lastActive = now;
      timeLimit.isOnline = true;
      await timeLimit.save();
      lastUpdates.set(userId, now.getTime());

      // Log time tracking for debugging
      const remainingMinutes = Math.floor(
        (DAILY_LIMIT - newTimeSpent) / (1000 * 60)
      );
      const sessionSeconds = Math.floor(timeToAdd / 1000);

      console.log(`⏰ User ${userId} time tracking:`, {
        timeSpentToday: Math.floor(newTimeSpent / (1000 * 60)), // in minutes
        remainingMinutes,
        sessionTimeSeconds: sessionSeconds,
        wasInactive,
        shouldReset,
      });

      // If time limit exceeded, send error response
      if (newTimeSpent >= DAILY_LIMIT) {
        return res.status(403).json({
          error: "Daily time limit exceeded",
          message:
            "You have reached your daily usage limit of 2.5 hours. Please try again tomorrow.",
          timeSpent: newTimeSpent,
          timeLimit: DAILY_LIMIT,
          remainingTime: 0,
          resetTime: new Date(
            timeLimit.lastReset.getTime() + 24 * 60 * 60 * 1000
          ).toISOString(),
        });
      }
    }

    // Add time info to request for use in routes
    req.timeLimit = {
      timeSpent: timeLimit.timeSpentToday,
      remaining: timeLimit.getRemainingTime(),
      isOnline: timeLimit.isOnline,
      lastActive: timeLimit.lastActive,
      lastReset: timeLimit.lastReset,
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
    // Get token from either cookies or Authorization header
    let token = req.cookies.accessToken;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.id;

      const timeLimit = await UserTimeLimit.findOne({ userId });
      if (timeLimit) {
        timeLimit.isOnline = false;
        await timeLimit.save();
        console.log(`⏰ User ${userId} marked offline`);
      }
    }
    next();
  } catch (error) {
    console.error("Mark offline error:", error);
    next();
  }
};
