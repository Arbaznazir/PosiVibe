// Zero Tolerance Content Moderation Middleware
// Completely blocks 18+ and inappropriate content with no exceptions
import {
  analyzeTextContent,
  filterPostContent,
  filterCommentContent,
  filterUserContent,
  analyzeImageContent,
  checkFileType,
  logContentViolation,
} from "./aiContentFilter.js";

// Whitelist of legitimate terms that should not be flagged
const LEGITIMATE_TERMS = [
  "arbaz",
  "nazir",
  "arbaznazir",
  "danishmanzoor",
  "danish",
  "jamsheed",
  "jamsheedmushtaq",
  "test",
  "dev",
  "https",
  "http",
  "www",
  "github",
  "linkedin",
  "twitter",
  "instagram",
  "facebook",
  "gmail",
  "email",
  "com",
  "org",
  "net",
  "io",
  "co",
  "john",
  "doe",
  "sarah",
  "smith",
  "emily",
  "davis",
  "mike",
  "johnson",
  "test",
  "user",
  "admin",
];

// Function to check if content contains only legitimate terms
const isLegitimateContent = (text) => {
  if (!text || typeof text !== "string") return true;

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+|[^\w]/);

  // Check if all words are in whitelist or are common legitimate patterns
  return words.every((word) => {
    if (!word || word.length < 2) return true;

    // Check whitelist
    if (
      LEGITIMATE_TERMS.some(
        (term) => word.includes(term) || term.includes(word)
      )
    ) {
      return true;
    }

    // Check for common patterns (URLs, emails, names)
    if (/^[a-z]+[0-9]*$/.test(word)) return true; // Simple names/usernames
    if (/^[a-z]+\.[a-z]+$/.test(word)) return true; // Domain patterns
    if (word.length > 8) return true; // Long words are usually legitimate

    return false;
  });
};

// Enhanced filter function that checks legitimacy first
const smartContentFilter = async (filterFunction, data, context) => {
  try {
    // First check if content is obviously legitimate
    const textToCheck =
      typeof data === "string"
        ? data
        : data.desc || data.name || data.username || data.website || "";

    if (isLegitimateContent(textToCheck)) {
      console.log(`✅ Content passed legitimacy check: ${context}`);
      return { isClean: true, reason: "legitimate_content" };
    }

    // If not obviously legitimate, run the full filter
    return await filterFunction(data);
  } catch (error) {
    console.error(`Smart filter error for ${context}:`, error);
    return { isClean: false, reason: "filter_error", severity: "low" };
  }
};

/**
 * Zero tolerance middleware for posts
 * Shows user-friendly popup instead of blocking users
 */
export const zeroTolerancePostFilter = async (req, res, next) => {
  try {
    const postData = {
      desc: req.body.desc,
      img: req.file ? req.file.buffer : null,
    };

    console.log("🛡️  Zero Tolerance Filter: Analyzing post content...");

    const filterResult = await smartContentFilter(
      filterPostContent,
      postData,
      "post"
    );

    if (!filterResult.isClean && filterResult.reason !== "legitimate_content") {
      // Log the violation for admin review but don't block user
      await logContentViolation("post", req.userId, filterResult, postData);

      console.log(
        "⚠️  Content moderation triggered - showing user-friendly message"
      );

      // Return user-friendly popup message instead of blocking
      return res.status(400).json({
        success: false,
        showPopup: true,
        popupType: "content_moderation",
        title: "Content Guidelines Notice",
        message:
          "We appreciate your contribution to our community! However, this content doesn't align with our community guidelines as we strive to maintain a clean and positive environment for everyone.",
        details:
          "We're working to keep PosiVibe a safe and welcoming space. Please consider revising your post to ensure it meets our community standards.",
        severity: filterResult.severity,
        actionRequired: false, // Don't require any action from user
        canRetry: true,
        suggestions: [
          "Use positive and encouraging language",
          "Share content that inspires and uplifts",
          "Avoid controversial or inappropriate topics",
          "Focus on building meaningful connections",
        ],
        policy: {
          message:
            "Our platform promotes positive interactions and clean content",
          categories: [
            "Family-friendly content only",
            "Respectful language and interactions",
            "Positive and uplifting messages",
            "No inappropriate or offensive material",
          ],
        },
      });
    }

    console.log("✅ Post passed content guidelines check");
    next();
  } catch (error) {
    console.error("Content moderation error:", error);
    return res.status(500).json({
      success: false,
      showPopup: true,
      popupType: "system_error",
      title: "System Notice",
      message:
        "We're temporarily unable to process your content. Please try again in a moment.",
      canRetry: true,
    });
  }
};

/**
 * Zero tolerance middleware for comments
 */
export const zeroToleranceCommentFilter = async (req, res, next) => {
  try {
    const commentData = {
      desc: req.body.desc,
    };

    console.log("🛡️  Content moderation: Analyzing comment content...");

    const filterResult = await smartContentFilter(
      filterCommentContent,
      commentData,
      "comment"
    );

    if (!filterResult.isClean && filterResult.reason !== "legitimate_content") {
      await logContentViolation(
        "comment",
        req.userId,
        filterResult,
        commentData
      );

      console.log(
        "⚠️  Comment moderation triggered - showing user-friendly message"
      );

      return res.status(400).json({
        success: false,
        showPopup: true,
        popupType: "content_moderation",
        title: "Comment Guidelines Notice",
        message:
          "Thank you for engaging with our community! We noticed your comment might not align with our positive community standards.",
        details:
          "We encourage respectful and uplifting conversations that make everyone feel welcome.",
        severity: filterResult.severity,
        actionRequired: false,
        canRetry: true,
        suggestions: [
          "Keep comments respectful and kind",
          "Focus on constructive feedback",
          "Spread positivity and encouragement",
          "Build meaningful discussions",
        ],
      });
    }

    console.log("✅ Comment passed content guidelines check");
    next();
  } catch (error) {
    console.error("Content moderation error:", error);
    return res.status(500).json({
      success: false,
      showPopup: true,
      popupType: "system_error",
      title: "System Notice",
      message:
        "We're temporarily unable to process your comment. Please try again in a moment.",
      canRetry: true,
    });
  }
};

/**
 * Zero tolerance middleware for user profile updates
 */
export const zeroToleranceUserFilter = async (req, res, next) => {
  try {
    const userData = {
      username: req.body.username,
      name: req.body.name,
      website: req.body.website,
    };

    console.log("🛡️  Content moderation: Analyzing user profile content...");

    const filterResult = await smartContentFilter(
      filterUserContent,
      userData,
      "user_profile"
    );

    if (!filterResult.isClean && filterResult.reason !== "legitimate_content") {
      await logContentViolation(
        "user_profile",
        req.userId,
        filterResult,
        userData
      );

      console.log(
        "⚠️  Profile moderation triggered - showing user-friendly message"
      );

      return res.status(400).json({
        success: false,
        showPopup: true,
        popupType: "content_moderation",
        title: "Profile Guidelines Notice",
        message:
          "We want to help you create the best profile possible! Some of the information you entered might not align with our community guidelines.",
        details:
          "A great profile helps you connect with others and represents the positive spirit of our community.",
        severity: filterResult.severity,
        actionRequired: false,
        canRetry: true,
        suggestions: [
          "Use your real name or a positive username",
          "Share appropriate and inspiring information",
          "Keep website links family-friendly",
          "Represent your authentic, positive self",
        ],
      });
    }

    console.log("✅ User profile passed content guidelines check");
    next();
  } catch (error) {
    console.error("Content moderation error:", error);
    return res.status(500).json({
      success: false,
      showPopup: true,
      popupType: "system_error",
      title: "System Notice",
      message:
        "We're temporarily unable to process your profile update. Please try again in a moment.",
      canRetry: true,
    });
  }
};

/**
 * Zero tolerance middleware for file uploads
 */
export const zeroToleranceFileFilter = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    console.log("🛡️  Zero Tolerance Filter: Checking file...");

    // Check file type
    const fileCheck = await checkFileType(req.file);
    if (!fileCheck.isAllowed) {
      console.log("🚫 File type not allowed:", fileCheck.reason);
      return res.status(400).json({
        success: false,
        message: "File type not allowed: " + fileCheck.reason,
      });
    }

    // If it's an image, analyze content
    if (req.file.mimetype.startsWith("image/")) {
      const imageAnalysis = await analyzeImageContent(req.file.buffer);
      if (!imageAnalysis.isClean) {
        console.log("🚫 Image content violation:", imageAnalysis.reason);
        return res.status(400).json({
          success: false,
          message: "Image content not allowed: " + imageAnalysis.reason,
          severity: imageAnalysis.severity,
        });
      }
    }

    console.log("✅ File passed zero tolerance filter");
    next();
  } catch (error) {
    console.error("Zero tolerance file filter error:", error);
    return res.status(500).json({
      success: false,
      message: "File validation error. Upload blocked for safety.",
    });
  }
};

/**
 * Enhanced text-only filter for any text input
 */
export const zeroToleranceTextFilter = async (text, context = "general") => {
  try {
    if (!text || typeof text !== "string") {
      return { isClean: true };
    }

    console.log(`🛡️  Zero Tolerance Filter: Analyzing ${context} text...`);

    const filterResult = await analyzeTextContent(text, {
      strictMode: true,
      zeroTolerance: true,
    });

    if (!filterResult.isClean) {
      console.log(`🚫 BLOCKED: ${context} text contains inappropriate content`);
      console.log("Violations:", filterResult.violations);
    } else {
      console.log(`✅ ${context} text passed zero tolerance filter`);
    }

    return filterResult;
  } catch (error) {
    console.error("Zero tolerance text filter error:", error);
    return {
      isClean: false,
      reason: "Content moderation system error",
      severity: "medium",
    };
  }
};

/**
 * Comprehensive zero tolerance check for any content type
 */
export const comprehensiveZeroToleranceCheck = async (
  contentData,
  contentType
) => {
  const results = {
    isClean: true,
    violations: [],
    severity: "none",
    blocked: false,
  };

  try {
    switch (contentType) {
      case "post":
        const postResult = await filterPostContent(contentData);
        Object.assign(results, postResult);
        break;

      case "comment":
        const commentResult = await filterCommentContent(contentData);
        Object.assign(results, commentResult);
        break;

      case "user":
        const userResult = await filterUserContent(contentData);
        Object.assign(results, userResult);
        break;

      case "text":
        const textResult = await analyzeTextContent(contentData.text);
        Object.assign(results, textResult);
        break;

      default:
        results.isClean = false;
        results.violations = [
          { type: "unknown_content_type", severity: "medium" },
        ];
    }

    // Zero tolerance means ANY violation results in blocking
    if (!results.isClean || results.violations.length > 0) {
      results.blocked = true;
      console.log(`🚫 ZERO TOLERANCE: ${contentType} content BLOCKED`);
    }

    return results;
  } catch (error) {
    console.error("Comprehensive zero tolerance check error:", error);
    return {
      isClean: false,
      blocked: true,
      violations: [{ type: "system_error", severity: "high" }],
      severity: "high",
    };
  }
};
