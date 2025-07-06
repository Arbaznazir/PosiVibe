import mongoose from "mongoose";

const UserTimeLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    timeSpentToday: {
      type: Number,
      default: 0, // Time spent in milliseconds
      min: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastReset: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Reset time at midnight
UserTimeLimitSchema.methods.shouldResetTime = function () {
  const now = new Date();
  const lastReset = new Date(this.lastReset);

  // Create midnight of today
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  // Create midnight of last reset day
  const lastResetMidnight = new Date(lastReset);
  lastResetMidnight.setHours(0, 0, 0, 0);

  // Reset if:
  // 1. It's a different calendar day (more accurate than checking date/month/year separately)
  // 2. OR if more than 24 hours have passed since last reset (safety check)
  const isDifferentDay =
    todayMidnight.getTime() !== lastResetMidnight.getTime();
  const isMoreThan24Hours =
    now.getTime() - lastReset.getTime() >= 24 * 60 * 60 * 1000;

  // Additional safety: don't reset if less than 1 hour has passed (prevents rapid resets)
  const isAtLeastOneHour =
    now.getTime() - lastReset.getTime() >= 60 * 60 * 1000;

  return (isDifferentDay || isMoreThan24Hours) && isAtLeastOneHour;
};

// Get remaining time in milliseconds
UserTimeLimitSchema.methods.getRemainingTime = function () {
  const DAILY_LIMIT = 2.5 * 60 * 60 * 1000; // 2.5 hours in milliseconds
  return Math.max(0, DAILY_LIMIT - this.timeSpentToday);
};

// Format time for display
UserTimeLimitSchema.methods.getFormattedTime = function () {
  const remaining = this.getRemainingTime();
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// Check if user should be marked as inactive
UserTimeLimitSchema.methods.shouldMarkInactive = function (
  inactiveTimeout = 5 * 60 * 1000
) {
  const now = new Date();
  return now - this.lastActive >= inactiveTimeout;
};

// Add pre-save middleware to ensure timeSpentToday doesn't exceed daily limit
UserTimeLimitSchema.pre("save", function (next) {
  const DAILY_LIMIT = 2.5 * 60 * 60 * 1000;
  if (this.timeSpentToday > DAILY_LIMIT) {
    this.timeSpentToday = DAILY_LIMIT;
  }
  next();
});

const UserTimeLimit = mongoose.model("UserTimeLimit", UserTimeLimitSchema);

// Function to get user's time limit info
export const getUserTimeLimit = async (userId) => {
  try {
    let timeLimit = await UserTimeLimit.findOne({ userId });

    // If no time limit exists, create one
    if (!timeLimit) {
      timeLimit = new UserTimeLimit({ userId });
      await timeLimit.save();
    }

    const now = new Date();
    const lastResetDate = new Date(timeLimit.lastReset);
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);
    const lastResetMidnight = new Date(lastResetDate);
    lastResetMidnight.setHours(0, 0, 0, 0);

    // Only reset if it's a new day AND we haven't already reset today
    if (
      todayMidnight.getTime() !== lastResetMidnight.getTime() &&
      now.getTime() - lastResetDate.getTime() >= 60 * 60 * 1000
    ) {
      timeLimit.timeSpentToday = 0;
      timeLimit.lastReset = now;
      await timeLimit.save();
    }

    // Update last active time
    timeLimit.lastActive = now;
    await timeLimit.save();

    const DAILY_LIMIT = 2.5 * 60 * 60 * 1000; // 2.5 hours in milliseconds
    const remaining = timeLimit.getRemainingTime();
    const nextReset = new Date(todayMidnight);
    nextReset.setDate(nextReset.getDate() + 1); // Next midnight

    return {
      remaining,
      dailyLimit: DAILY_LIMIT,
      resetTime: nextReset.toISOString(),
      timeSpentToday: timeLimit.timeSpentToday,
    };
  } catch (err) {
    console.error("Error getting user time limit:", err);
    throw err;
  }
};

export default UserTimeLimit;
