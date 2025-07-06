import User from "../models/User.js";

// Trust score deduction weights based on violation severity
const TRUST_PENALTIES = {
  critical: 15, // Reduced from 25
  high: 10, // Reduced from 15
  medium: 5, // Reduced from 10
  low: 2, // Reduced from 5
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

    // Instead of banning, add warning if trust score is low
    if (newTrustScore < 30 && !user.warnings) {
      user.warnings = [];
    }

    if (newTrustScore < 30) {
      user.warnings.push({
        reason: `Trust score low (${newTrustScore}) due to ${violation.type} violation`,
        timestamp: new Date(),
      });
    }

    await user.save();

    return {
      userId,
      newTrustScore,
      penalty,
      warnings: user.warnings,
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
      canPerformActions: true, // Always allow actions, but with reduced trust
      trustScore: user.trustScore,
      warnings: user.warnings || [],
      requiresModeration: user.trustScore < 50, // Posts require moderation if trust score is low
    };
  } catch (error) {
    console.error("Trust status check error:", error);
    throw error;
  }
};

/**
 * Admin function to reset user's trust score
 * @param {string} userId - The user's ID
 * @param {string} adminId - The admin's user ID
 * @returns {Promise<Object>} Updated user info
 */
export const resetTrustScore = async (userId, adminId) => {
  try {
    const [user, admin] = await Promise.all([
      User.findById(userId),
      User.findById(adminId),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    if (!admin || !admin.isAdmin) {
      throw new Error("Unauthorized: Only admins can reset trust scores");
    }

    // Reset user's status
    user.trustScore = 70; // Start with 70% trust
    user.warnings = [];

    // Record the reset event
    user.trustHistory.push({
      score: 70,
      reason: "Admin trust score reset",
      violationType: "reset",
      timestamp: new Date(),
    });

    await user.save();

    return {
      userId,
      trustScore: user.trustScore,
      message: "User trust score reset successfully",
    };
  } catch (error) {
    console.error("Trust score reset error:", error);
    throw error;
  }
};
