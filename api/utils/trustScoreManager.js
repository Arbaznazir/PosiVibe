import User from "../models/User.js";

// Trust score deduction weights based on violation severity
const TRUST_PENALTIES = {
  critical: 25, // Severe violations
  high: 15, // Major violations
  medium: 10, // Moderate violations
  low: 5, // Minor violations
};

/**
 * Updates a user's trust score based on content violation
 * @param {string} userId - The user's ID
 * @param {Object} violation - The content violation details
 * @returns {Promise<Object>} Updated user trust score info
 */
export const updateTrustScore = async (userId, violation) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate penalty based on violation severity
    const penalty = TRUST_PENALTIES[violation.severity] || TRUST_PENALTIES.low;

    // Calculate new trust score (never go below 0)
    const newTrustScore = Math.max(0, user.trustScore - penalty);

    // Record the trust score change
    const trustEvent = {
      score: newTrustScore,
      reason: violation.reason || "Content violation",
      violationType: violation.type,
      timestamp: new Date(),
    };

    // Update user document
    user.trustScore = newTrustScore;
    user.trustHistory.push(trustEvent);

    // If trust score hits 0, ban the user
    if (newTrustScore === 0 && !user.isBanned) {
      user.isBanned = true;
      user.banReason = "Trust score depleted due to multiple violations";
    }

    await user.save();

    return {
      userId,
      newTrustScore,
      penalty,
      isBanned: user.isBanned,
      trustEvent,
    };
  } catch (error) {
    console.error("Trust score update error:", error);
    throw error;
  }
};

/**
 * Checks if a user can perform actions based on trust score
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User's trust status
 */
export const checkTrustStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      canPerformActions: !user.isBanned,
      trustScore: user.trustScore,
      isBanned: user.isBanned,
      banReason: user.banReason,
    };
  } catch (error) {
    console.error("Trust status check error:", error);
    throw error;
  }
};

/**
 * Admin function to unban a user and reset trust score
 * @param {string} userId - The user's ID
 * @param {string} adminId - The admin's user ID
 * @returns {Promise<Object>} Updated user info
 */
export const unbanUser = async (userId, adminId) => {
  try {
    const [user, admin] = await Promise.all([
      User.findById(userId),
      User.findById(adminId),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    if (!admin || !admin.isAdmin) {
      throw new Error("Unauthorized: Only admins can unban users");
    }

    // Reset user's status
    user.isBanned = false;
    user.trustScore = 50; // Start with 50% trust after unban
    user.banReason = "";

    // Record the unban event
    user.trustHistory.push({
      score: 50,
      reason: "Admin unban",
      violationType: "unban",
      timestamp: new Date(),
    });

    await user.save();

    return {
      userId,
      trustScore: user.trustScore,
      isBanned: false,
      message: "User unbanned successfully",
    };
  } catch (error) {
    console.error("Unban error:", error);
    throw error;
  }
};
