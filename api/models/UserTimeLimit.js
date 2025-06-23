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

  // Reset if it's a different day or if it's been more than 24 hours
  return (
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear() ||
    now - lastReset >= 24 * 60 * 60 * 1000
  );
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

    // Check if we should reset the time
    if (timeLimit.shouldResetTime()) {
      timeLimit.timeSpentToday = 0;
      timeLimit.lastReset = new Date();
      await timeLimit.save();
    }

    // Update last active time
    timeLimit.lastActive = new Date();
    await timeLimit.save();

    const DAILY_LIMIT = 2.5 * 60 * 60 * 1000; // 2.5 hours in milliseconds
    const remaining = timeLimit.getRemainingTime();
    const resetTime = new Date(timeLimit.lastReset);
    resetTime.setHours(24, 0, 0, 0); // Next midnight

    return {
      remaining,
      dailyLimit: DAILY_LIMIT,
      resetTime: resetTime.toISOString(),
      timeSpentToday: timeLimit.timeSpentToday,
    };
  } catch (err) {
    console.error("Error getting user time limit:", err);
    throw err;
  }
};

export default UserTimeLimit;
