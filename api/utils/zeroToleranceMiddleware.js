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
} from "./contentFilter.js";

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
 * Completely blocks any content that fails moderation
 */
export const zeroTolerancePostFilter = async (req, res, next) => {
  try {
    const postData = {
      desc: req.body.desc,
      img: req.file ? req.file.filename : null,
    };

    console.log("🛡️  Zero Tolerance Filter: Analyzing post content...");

    const filterResult = await smartContentFilter(
      filterPostContent,
      postData,
      "post"
    );

    if (!filterResult.isClean && filterResult.reason !== "legitimate_content") {
      // Log the violation
      await logContentViolation("post", req.userId, filterResult, postData);

      console.log("🚫 BLOCKED: Post contains inappropriate content");
      console.log("Violations:", filterResult.violations);

      // Delete uploaded file if it exists and was flagged
      if (
        req.file &&
        filterResult.violations?.some((v) => v.type.includes("image"))
      ) {
        try {
          const fs = await import("fs");
          const path = `./public/upload/${req.file.filename}`;
          if (fs.existsSync(path)) {
            fs.unlinkSync(path);
            console.log("🗑️  Deleted inappropriate image file");
          }
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }

      return res.status(400).json({
        success: false,
        message:
          "Your post contains inappropriate content that violates our community guidelines. Please review your content and try again with appropriate material.",
        severity: filterResult.severity,
        violations:
          filterResult.violations?.map((v) => ({
            type: v.type,
            reason: v.reason || "Content policy violation",
            severity: v.severity,
          })) || [],
        policy: {
          message:
            "This platform maintains a zero-tolerance policy for inappropriate content",
          categories: [
            "18+ adult content",
            "Sexual or suggestive material",
            "Profanity and offensive language",
            "Hate speech and discrimination",
            "Violence and threats",
            "Spam and commercial exploitation",
            "Drug-related content",
            "Inappropriate images or videos",
          ],
        },
      });
    }

    console.log("✅ Post passed zero tolerance filter");
    next();
  } catch (error) {
    console.error("Zero tolerance filter error:", error);
    return res.status(500).json({
      success: false,
      message: "Content moderation system error. Post blocked for safety.",
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

    console.log("🛡️  Zero Tolerance Filter: Analyzing comment content...");

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

      console.log("🚫 BLOCKED: Comment contains inappropriate content");

      return res.status(400).json({
        success: false,
        message:
          "Your comment contains inappropriate content that violates our community guidelines. Please keep comments respectful and appropriate.",
        severity: filterResult.severity,
        violations: filterResult.violations?.map((v) => ({
          type: v.type,
          reason: v.reason || "Content policy violation",
          severity: v.severity,
        })) || [
          {
            type: "content_violation",
            reason: filterResult.reason || "Inappropriate content detected",
            severity: filterResult.severity,
          },
        ],
      });
    }

    console.log("✅ Comment passed zero tolerance filter");
    next();
  } catch (error) {
    console.error("Zero tolerance comment filter error:", error);
    return res.status(500).json({
      success: false,
      message: "Content moderation system error. Comment blocked for safety.",
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

    console.log("🛡️  Zero Tolerance Filter: Analyzing user profile content...");

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

      console.log("🚫 BLOCKED: User profile contains inappropriate content");

      return res.status(400).json({
        success: false,
        message:
          "Your profile information contains inappropriate content that violates our community guidelines. Please use appropriate language and content.",
        severity: filterResult.severity,
        violations:
          filterResult.violations?.map((v) => ({
            type: v.type,
            reason: v.reason || "Content policy violation",
            severity: v.severity,
          })) || [],
      });
    }

    console.log("✅ User profile passed zero tolerance filter");
    next();
  } catch (error) {
    console.error("Zero tolerance user filter error:", error);
    return res.status(500).json({
      success: false,
      message:
        "Content moderation system error. Profile update blocked for safety.",
    });
  }
};

/**
 * Zero tolerance middleware for file uploads
 */
export const zeroToleranceFileFilter = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    console.log("🛡️  Zero Tolerance Filter: Analyzing uploaded file...");

    // Check file type first
    const fileTypeCheck = checkFileType(req.file.filename);
    if (!fileTypeCheck.isAllowed) {
      // Delete the uploaded file
      try {
        const fs = await import("fs");
        const path = `./public/upload/${req.file.filename}`;
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
          console.log("🗑️  Deleted dangerous file");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }

      return res.status(400).json({
        success: false,
        message: "File type not allowed",
        reason: fileTypeCheck.reason,
        severity: fileTypeCheck.severity,
      });
    }

    // If it's an image, analyze the content
    if (fileTypeCheck.type === "image") {
      try {
        const imagePath = `./public/upload/${req.file.filename}`;
        const imageAnalysis = await analyzeImageContent(imagePath);

        if (!imageAnalysis.isClean) {
          // Delete the inappropriate image
          try {
            const fs = await import("fs");
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log("🗑️  Deleted inappropriate image");
            }
          } catch (error) {
            console.error("Error deleting image:", error);
          }

          await logContentViolation("image_upload", req.userId, imageAnalysis, {
            filename: req.file.filename,
            originalname: req.file.originalname,
          });

          return res.status(400).json({
            success: false,
            message:
              "Image contains inappropriate content and cannot be uploaded",
            severity: imageAnalysis.severity,
            categories: imageAnalysis.categories,
            policy:
              "This platform has zero tolerance for 18+ or inappropriate visual content",
          });
        }
      } catch (error) {
        console.error("Image analysis error:", error);
        // If analysis fails, delete the file as a precaution
        try {
          const fs = await import("fs");
          const path = `./public/upload/${req.file.filename}`;
          if (fs.existsSync(path)) {
            fs.unlinkSync(path);
            console.log("🗑️  Deleted file due to analysis failure");
          }
        } catch (deleteError) {
          console.error("Error deleting file:", deleteError);
        }

        return res.status(500).json({
          success: false,
          message:
            "Unable to verify image safety. Upload blocked for security.",
        });
      }
    }

    console.log("✅ File passed zero tolerance filter");
    next();
  } catch (error) {
    console.error("Zero tolerance file filter error:", error);
    return res.status(500).json({
      success: false,
      message:
        "Content moderation system error. File upload blocked for safety.",
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
