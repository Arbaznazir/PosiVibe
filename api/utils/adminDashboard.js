// Admin Dashboard for Content Moderation
// This would typically be stored in a database in a real application

let contentViolations = [];
let bannedUsers = [];
let flaggedContent = [];

/**
 * Add a content violation to the tracking system
 * @param {object} violation - Violation details
 */
export const addViolation = (violation) => {
  contentViolations.push(violation);

  // Auto-flag users with multiple violations
  const userViolations = contentViolations.filter(
    (v) => v.userId === violation.userId
  );
  if (userViolations.length >= 3) {
    flagUser(violation.userId, "Multiple content violations");
  }

  // Auto-ban users with critical violations
  if (violation.severity === "critical") {
    const criticalViolations = userViolations.filter(
      (v) => v.severity === "critical"
    );
    if (criticalViolations.length >= 1) {
      banUser(violation.userId, "Critical content violation");
    }
  }
};

/**
 * Flag a user for review
 * @param {string} userId - User ID to flag
 * @param {string} reason - Reason for flagging
 */
export const flagUser = (userId, reason) => {
  const existingFlag = flaggedContent.find((f) => f.userId === userId);
  if (!existingFlag) {
    flaggedContent.push({
      userId: userId,
      reason: reason,
      flaggedAt: new Date().toISOString(),
      status: "pending_review",
    });
    console.warn(`🚩 User flagged for review: ${userId} - ${reason}`);
  }
};

/**
 * Ban a user from the platform
 * @param {string} userId - User ID to ban
 * @param {string} reason - Reason for banning
 */
export const banUser = (userId, reason) => {
  const existingBan = bannedUsers.find((b) => b.userId === userId);
  if (!existingBan) {
    bannedUsers.push({
      userId: userId,
      reason: reason,
      bannedAt: new Date().toISOString(),
      bannedBy: "system",
      status: "active",
    });
    console.error(`🔨 User banned: ${userId} - ${reason}`);
  }
};

/**
 * Check if a user is banned
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user is banned
 */
export const isUserBanned = (userId) => {
  return bannedUsers.some(
    (ban) => ban.userId === userId && ban.status === "active"
  );
};

/**
 * Get content violation statistics
 * @returns {object} - Statistics about content violations
 */
export const getViolationStats = () => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recent24h = contentViolations.filter(
    (v) => new Date(v.timestamp) >= last24Hours
  );
  const recent7d = contentViolations.filter(
    (v) => new Date(v.timestamp) >= last7Days
  );

  const byType = contentViolations.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});

  const bySeverity = contentViolations.reduce((acc, v) => {
    acc[v.severity] = (acc[v.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    total: contentViolations.length,
    last24Hours: recent24h.length,
    last7Days: recent7d.length,
    byType: byType,
    bySeverity: bySeverity,
    bannedUsers: bannedUsers.length,
    flaggedUsers: flaggedContent.length,
  };
};

/**
 * Get recent violations for admin review
 * @param {number} limit - Number of violations to return
 * @returns {array} - Recent violations
 */
export const getRecentViolations = (limit = 10) => {
  return contentViolations
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

/**
 * Admin endpoint to view moderation dashboard
 */
export const getModerationDashboard = () => {
  return {
    stats: getViolationStats(),
    recentViolations: getRecentViolations(5),
    bannedUsers: bannedUsers.slice(-5), // Last 5 banned users
    flaggedUsers: flaggedContent.filter((f) => f.status === "pending_review"),
  };
};

/**
 * Clean old violations (for memory management)
 * In a real app, you'd archive these to a database
 */
export const cleanOldViolations = () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const originalLength = contentViolations.length;

  contentViolations = contentViolations.filter(
    (v) => new Date(v.timestamp) >= thirtyDaysAgo
  );

  const cleaned = originalLength - contentViolations.length;
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} old violation records`);
  }
};

// Clean old violations every hour
setInterval(cleanOldViolations, 60 * 60 * 1000);
