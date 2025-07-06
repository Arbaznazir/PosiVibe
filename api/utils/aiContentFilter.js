// AI-First Content Moderation System
// Uses OpenAI's moderation API as primary method
// Priority: OpenAI moderation > Google Perspective API > Fallback rules
// No hard-coded word lists or manual rules

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { addViolation } from "./adminDashboard.js";
import OpenAI from "openai";
import sharp from "sharp";
import path from "path";

import { updateTrustScore, checkTrustStatus } from "./trustScoreManager.js";

// Initialize OpenAI for advanced content moderation (primary method)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log(
      "✅ OpenAI client initialized successfully for AI content moderation"
    );
  } else {
    console.error(
      "❌ OpenAI API key not provided - OpenAI moderation is required for this application"
    );
    throw new Error("OpenAI API key is required");
  }
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error.message);
  throw error; // OpenAI is required, so we throw the error
}

// Log available AI models
console.log("🤖 Available AI Models:", {
  openai: !!openai,
  perspective: true,
  omniModeration: !!openai,
});

console.log("✅ AI-First Content Moderation System Initialized");

// AI model thresholds from environment variables
const AI_THRESHOLDS = {
  OPENAI: {
    TOXICITY: parseFloat(process.env.OPENAI_TOXICITY_THRESHOLD) || 0.3,
    HATE: parseFloat(process.env.OPENAI_HATE_THRESHOLD) || 0.3,
    HARASSMENT: parseFloat(process.env.OPENAI_HARASSMENT_THRESHOLD) || 0.3,
    SELF_HARM: parseFloat(process.env.OPENAI_SELF_HARM_THRESHOLD) || 0.3,
    SEXUAL: parseFloat(process.env.OPENAI_SEXUAL_THRESHOLD) || 0.3,
    VIOLENCE: parseFloat(process.env.OPENAI_VIOLENCE_THRESHOLD) || 0.3,
  },
  PERSPECTIVE: {
    TOXICITY: parseFloat(process.env.TOXICITY_SOFT_THRESHOLD) || 0.3,
    SEVERE_TOXICITY: parseFloat(process.env.TOXICITY_MEDIUM_THRESHOLD) || 0.5,
    IDENTITY_ATTACK: parseFloat(process.env.TOXICITY_MEDIUM_THRESHOLD) || 0.5,
    INSULT: parseFloat(process.env.TOXICITY_SOFT_THRESHOLD) || 0.3,
    PROFANITY: parseFloat(process.env.TOXICITY_SOFT_THRESHOLD) || 0.3,
    THREAT: parseFloat(process.env.TOXICITY_HARD_THRESHOLD) || 0.7,
    SEXUALLY_EXPLICIT: parseFloat(process.env.TOXICITY_MEDIUM_THRESHOLD) || 0.5,
    FLIRTATION: parseFloat(process.env.TOXICITY_HARD_THRESHOLD) || 0.7,
  },
  NSFW: {
    SOFT: parseFloat(process.env.NSFW_SOFT_THRESHOLD) || 0.3,
    MEDIUM: parseFloat(process.env.NSFW_MEDIUM_THRESHOLD) || 0.5,
    HARD: parseFloat(process.env.NSFW_HARD_THRESHOLD) || 0.7,
    CRITICAL: parseFloat(process.env.NSFW_CRITICAL_THRESHOLD) || 0.9,
  },
};

/**
 * Analyze text and/or image content using OpenAI's moderation API
 * This is the primary AI-based content analysis method that supports both text and images
 * @param {string|Array} input - Text string or array of objects with text and image_url
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis result
 */
const analyzeWithOpenAI = async (input, options = {}) => {
  if (!openai) {
    console.warn("OpenAI not available, skipping OpenAI analysis");
    return null;
  }

  try {
    console.log("🤖 Analyzing content with OpenAI omni-moderation-latest...");

    // Prepare input for the omni-moderation API
    let moderationInput;

    if (typeof input === "string") {
      // Simple text input
      moderationInput = input;
    } else if (Array.isArray(input)) {
      // Multi-modal input (text + images)
      moderationInput = input;
    } else if (input.text || input.image_url) {
      // Single object with text and/or image
      moderationInput = [];
      if (input.text) {
        moderationInput.push({ type: "text", text: input.text });
      }
      if (input.image_url) {
        moderationInput.push({
          type: "image_url",
          image_url: { url: input.image_url },
        });
      }
    } else {
      console.warn("Invalid input format for OpenAI moderation");
      return null;
    }

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: moderationInput,
    });

    const result = response.results[0];
    const violations = [];

    // Check each category against thresholds with the new categories
    if (result.category_scores.harassment > AI_THRESHOLDS.OPENAI.HARASSMENT) {
      violations.push({
        type: "harassment",
        score: result.category_scores.harassment,
        flagged: result.categories.harassment,
        severity: result.category_scores.harassment > 0.7 ? "critical" : "high",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.harassment || [],
      });
    }

    if (
      result.category_scores["harassment/threatening"] >
      AI_THRESHOLDS.OPENAI.HARASSMENT
    ) {
      violations.push({
        type: "harassment_threatening",
        score: result.category_scores["harassment/threatening"],
        flagged: result.categories["harassment/threatening"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["harassment/threatening"] || [],
      });
    }

    if (result.category_scores.hate > AI_THRESHOLDS.OPENAI.HATE) {
      violations.push({
        type: "hate",
        score: result.category_scores.hate,
        flagged: result.categories.hate,
        severity: result.category_scores.hate > 0.7 ? "critical" : "high",
        source: "openai",
        applied_input_types: result.category_applied_input_types?.hate || [],
      });
    }

    if (
      result.category_scores["hate/threatening"] > AI_THRESHOLDS.OPENAI.HATE
    ) {
      violations.push({
        type: "hate_threatening",
        score: result.category_scores["hate/threatening"],
        flagged: result.categories["hate/threatening"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["hate/threatening"] || [],
      });
    }

    // New illicit categories
    if (result.category_scores.illicit > AI_THRESHOLDS.OPENAI.HARASSMENT) {
      violations.push({
        type: "illicit",
        score: result.category_scores.illicit,
        flagged: result.categories.illicit,
        severity: result.category_scores.illicit > 0.7 ? "critical" : "high",
        source: "openai",
        applied_input_types: result.category_applied_input_types?.illicit || [],
      });
    }

    if (
      result.category_scores["illicit/violent"] > AI_THRESHOLDS.OPENAI.VIOLENCE
    ) {
      violations.push({
        type: "illicit_violent",
        score: result.category_scores["illicit/violent"],
        flagged: result.categories["illicit/violent"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["illicit/violent"] || [],
      });
    }

    if (result.category_scores["self-harm"] > AI_THRESHOLDS.OPENAI.SELF_HARM) {
      violations.push({
        type: "self_harm",
        score: result.category_scores["self-harm"],
        flagged: result.categories["self-harm"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["self-harm"] || [],
      });
    }

    if (
      result.category_scores["self-harm/intent"] >
      AI_THRESHOLDS.OPENAI.SELF_HARM
    ) {
      violations.push({
        type: "self_harm_intent",
        score: result.category_scores["self-harm/intent"],
        flagged: result.categories["self-harm/intent"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["self-harm/intent"] || [],
      });
    }

    if (
      result.category_scores["self-harm/instructions"] >
      AI_THRESHOLDS.OPENAI.SELF_HARM
    ) {
      violations.push({
        type: "self_harm_instructions",
        score: result.category_scores["self-harm/instructions"],
        flagged: result.categories["self-harm/instructions"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["self-harm/instructions"] || [],
      });
    }

    if (result.category_scores.sexual > AI_THRESHOLDS.OPENAI.SEXUAL) {
      violations.push({
        type: "sexual",
        score: result.category_scores.sexual,
        flagged: result.categories.sexual,
        severity: result.category_scores.sexual > 0.7 ? "critical" : "high",
        source: "openai",
        applied_input_types: result.category_applied_input_types?.sexual || [],
      });
    }

    if (result.category_scores["sexual/minors"] > AI_THRESHOLDS.OPENAI.SEXUAL) {
      violations.push({
        type: "sexual_minors",
        score: result.category_scores["sexual/minors"],
        flagged: result.categories["sexual/minors"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["sexual/minors"] || [],
      });
    }

    if (result.category_scores.violence > AI_THRESHOLDS.OPENAI.VIOLENCE) {
      violations.push({
        type: "violence",
        score: result.category_scores.violence,
        flagged: result.categories.violence,
        severity: result.category_scores.violence > 0.7 ? "critical" : "high",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.violence || [],
      });
    }

    if (
      result.category_scores["violence/graphic"] > AI_THRESHOLDS.OPENAI.VIOLENCE
    ) {
      violations.push({
        type: "violence_graphic",
        score: result.category_scores["violence/graphic"],
        flagged: result.categories["violence/graphic"],
        severity: "critical",
        source: "openai",
        applied_input_types:
          result.category_applied_input_types?.["violence/graphic"] || [],
      });
    }

    const isClean = violations.length === 0;
    const confidence = isClean
      ? 0.95
      : Math.max(...violations.map((v) => v.score));

    // Check if any violations were detected in images
    const imageViolations = violations.filter(
      (v) => v.applied_input_types && v.applied_input_types.includes("image")
    );

    const textViolations = violations.filter(
      (v) =>
        !v.applied_input_types ||
        v.applied_input_types.length === 0 ||
        v.applied_input_types.includes("text")
    );

    console.log(`🤖 OpenAI omni-moderation Analysis Result:`, {
      isClean,
      violations: violations.length,
      imageViolations: imageViolations.length,
      textViolations: textViolations.length,
      confidence: confidence.toFixed(3),
      flagged: result.flagged,
      model: "omni-moderation-latest",
    });

    return {
      isClean,
      confidence,
      violations,
      severity: determineSeverity(violations),
      details: {
        openai: {
          model: "omni-moderation-latest",
          flagged: result.flagged,
          categories: result.categories,
          category_scores: result.category_scores,
          category_applied_input_types: result.category_applied_input_types,
        },
      },
      imageViolations,
      textViolations,
    };
  } catch (error) {
    console.error("OpenAI omni-moderation error:", error.message);
    if (error.status === 429) {
      console.warn(
        "OpenAI rate limit exceeded, falling back to Google Perspective API"
      );
    }
    return null;
  }
};

/**
 * Analyze text toxicity using Google Perspective API
 * This is the secondary AI-based text analysis method
 */
const analyzeToxicityWithPerspective = async (text) => {
  if (!process.env.GOOGLE_PERSPECTIVE_API_KEY) {
    console.warn("Google Perspective API key not provided");
    return null;
  }

  try {
    console.log("🔍 Analyzing content with Google Perspective API...");

    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.GOOGLE_PERSPECTIVE_API_KEY}`,
      {
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {},
          SEXUALLY_EXPLICIT: {},
          FLIRTATION: {},
        },
        languages: ["en"],
        doNotStore: true,
        comment: {
          text: text,
        },
      }
    );

    const scores = response.data.attributeScores;
    const violations = [];

    // Check each attribute against thresholds
    if (
      scores.TOXICITY?.summaryScore?.value > AI_THRESHOLDS.PERSPECTIVE.TOXICITY
    ) {
      violations.push({
        type: "toxicity",
        score: scores.TOXICITY.summaryScore.value,
        severity:
          scores.TOXICITY.summaryScore.value > 0.7 ? "critical" : "high",
        source: "perspective",
      });
    }

    if (
      scores.SEVERE_TOXICITY?.summaryScore?.value >
      AI_THRESHOLDS.PERSPECTIVE.SEVERE_TOXICITY
    ) {
      violations.push({
        type: "severe_toxicity",
        score: scores.SEVERE_TOXICITY.summaryScore.value,
        severity: "critical",
        source: "perspective",
      });
    }

    if (
      scores.IDENTITY_ATTACK?.summaryScore?.value >
      AI_THRESHOLDS.PERSPECTIVE.IDENTITY_ATTACK
    ) {
      violations.push({
        type: "identity_attack",
        score: scores.IDENTITY_ATTACK.summaryScore.value,
        severity: "critical",
        source: "perspective",
      });
    }

    if (scores.INSULT?.summaryScore?.value > AI_THRESHOLDS.PERSPECTIVE.INSULT) {
      violations.push({
        type: "insult",
        score: scores.INSULT.summaryScore.value,
        severity: scores.INSULT.summaryScore.value > 0.7 ? "high" : "medium",
        source: "perspective",
      });
    }

    if (
      scores.PROFANITY?.summaryScore?.value >
      AI_THRESHOLDS.PERSPECTIVE.PROFANITY
    ) {
      violations.push({
        type: "profanity",
        score: scores.PROFANITY.summaryScore.value,
        severity: scores.PROFANITY.summaryScore.value > 0.7 ? "high" : "medium",
        source: "perspective",
      });
    }

    if (scores.THREAT?.summaryScore?.value > AI_THRESHOLDS.PERSPECTIVE.THREAT) {
      violations.push({
        type: "threat",
        score: scores.THREAT.summaryScore.value,
        severity: "critical",
        source: "perspective",
      });
    }

    if (
      scores.SEXUALLY_EXPLICIT?.summaryScore?.value >
      AI_THRESHOLDS.PERSPECTIVE.SEXUALLY_EXPLICIT
    ) {
      violations.push({
        type: "sexually_explicit",
        score: scores.SEXUALLY_EXPLICIT.summaryScore.value,
        severity: "high",
        source: "perspective",
      });
    }

    const isClean = violations.length === 0;
    const confidence = isClean
      ? 0.9
      : Math.max(...violations.map((v) => v.score));

    console.log(`🔍 Perspective API Analysis Result:`, {
      isClean,
      violations: violations.length,
      confidence: confidence.toFixed(3),
      toxicity: scores.TOXICITY?.summaryScore?.value?.toFixed(3) || "N/A",
    });

    return {
      isClean,
      confidence,
      violations,
      severity: determineSeverity(violations),
      details: {
        perspective: {
          scores: Object.keys(scores).reduce((acc, key) => {
            acc[key] = scores[key]?.summaryScore?.value || 0;
            return acc;
          }, {}),
        },
      },
      // Legacy format for backward compatibility
      toxicityScore: scores.TOXICITY?.summaryScore?.value || 0,
      severeToxicityScore: scores.SEVERE_TOXICITY?.summaryScore?.value || 0,
      identityAttackScore: scores.IDENTITY_ATTACK?.summaryScore?.value || 0,
      insultScore: scores.INSULT?.summaryScore?.value || 0,
      profanityScore: scores.PROFANITY?.summaryScore?.value || 0,
      threatScore: scores.THREAT?.summaryScore?.value || 0,
      sexuallyExplicitScore: scores.SEXUALLY_EXPLICIT?.summaryScore?.value || 0,
    };
  } catch (error) {
    console.error("Google Perspective API error:", error.message);
    return null;
  }
};

/**
 * Analyze combined text and image content using OpenAI's omni-moderation-latest API
 * @param {Object} content - Content object with text and/or imageUrl
 * @param {string} content.text - Text content to analyze
 * @param {string} content.imageUrl - Image URL to analyze (base64 data URL or regular URL)
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeCombinedContent = async (content, options = {}) => {
  if (!content || (!content.text && !content.imageUrl)) {
    return { isClean: true, confidence: 1.0 };
  }

  try {
    console.log(
      "🔍 Analyzing combined text and image content with OpenAI moderation"
    );

    // Prepare multi-modal input for OpenAI
    const moderationInput = [];

    if (content.text && content.text.trim()) {
      moderationInput.push({
        type: "text",
        text: content.text,
      });
    }

    if (content.imageUrl) {
      moderationInput.push({
        type: "image_url",
        image_url: {
          url: content.imageUrl,
        },
      });
    }

    // Primary: Use OpenAI's moderation API
    const openAIResult = await analyzeWithOpenAI(moderationInput, options);

    // If OpenAI analysis succeeds and finds violations, return immediately
    if (openAIResult && !openAIResult.isClean) {
      console.log("✅ OpenAI found violations, using primary analysis result");
      return openAIResult;
    }

    // If OpenAI analysis fails or finds no violations, try secondary methods
    const results = {
      isClean: true,
      confidence: 1.0,
      violations: [],
      severity: "none",
      details: {},
    };

    // Secondary: Analyze text with Perspective API if available
    if (content.text && process.env.GOOGLE_PERSPECTIVE_API_KEY) {
      const textResult = await analyzeToxicityWithPerspective(content.text);
      if (textResult && !textResult.isClean) {
        results.violations.push(...textResult.violations);
        Object.assign(results.details, textResult.details);
      }
    }

    // Secondary: Analyze image with OpenAI's dedicated image moderation
    if (content.imageUrl && !results.violations.length) {
      const imageResult = await analyzeImageWithOpenAI(
        content.imageUrl,
        options
      );
      if (imageResult && !imageResult.isClean) {
        results.violations.push(...imageResult.violations);
        Object.assign(results.details, imageResult.details);
      }
    }

    // Determine final result
    if (results.violations.length > 0) {
      results.isClean = false;
      results.severity = determineSeverity(results.violations);
      results.confidence = calculateConfidence(results.violations);
    }

    console.log("✅ Combined Content Analysis Complete:", {
      isClean: results.isClean,
      violations: results.violations.length,
      severity: results.severity,
      confidence: results.confidence.toFixed(3),
      sources: [...new Set(results.violations.map((v) => v.source))],
    });

    return results;
  } catch (error) {
    console.error("Combined content analysis error:", error.message);

    // Conservative approach: if analysis fails, consider content suspicious
    return {
      isClean: false,
      confidence: 0.1,
      violations: [
        {
          type: "analysis_error",
          severity: "medium",
          source: "system",
          reason: "Combined analysis failed - content blocked for safety",
        },
      ],
      severity: "medium",
      details: { error: error.message },
    };
  }
};

/**
 * Analyze image content using OpenAI's omni-moderation-latest API
 * @param {string} imageUrl - Image URL (can be base64 data URL or regular URL)
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis result
 */
const analyzeImageWithOpenAI = async (imageUrl, options = {}) => {
  if (!openai) {
    console.warn("OpenAI not available, skipping OpenAI image analysis");
    return null;
  }

  try {
    console.log("🤖 Analyzing image with OpenAI omni-moderation-latest...");

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        },
      ],
    });

    const result = response.results[0];
    const violations = [];

    // Check each category against thresholds for image-specific violations
    Object.entries(result.category_scores).forEach(([category, score]) => {
      const appliedInputTypes =
        result.category_applied_input_types?.[category] || [];

      // Only process violations that were detected in the image
      if (appliedInputTypes.includes("image")) {
        let threshold = 0.3; // Default threshold
        let severity = "medium";

        // Set appropriate thresholds based on category
        switch (category) {
          case "harassment":
            threshold = AI_THRESHOLDS.OPENAI.HARASSMENT;
            severity = score > 0.7 ? "critical" : "high";
            break;
          case "harassment/threatening":
            threshold = AI_THRESHOLDS.OPENAI.HARASSMENT;
            severity = "critical";
            break;
          case "hate":
            threshold = AI_THRESHOLDS.OPENAI.HATE;
            severity = score > 0.7 ? "critical" : "high";
            break;
          case "hate/threatening":
            threshold = AI_THRESHOLDS.OPENAI.HATE;
            severity = "critical";
            break;
          case "illicit":
            threshold = AI_THRESHOLDS.OPENAI.HARASSMENT;
            severity = score > 0.7 ? "critical" : "high";
            break;
          case "illicit/violent":
            threshold = AI_THRESHOLDS.OPENAI.VIOLENCE;
            severity = "critical";
            break;
          case "self-harm":
          case "self-harm/intent":
          case "self-harm/instructions":
            threshold = AI_THRESHOLDS.OPENAI.SELF_HARM;
            severity = "critical";
            break;
          case "sexual":
            threshold = AI_THRESHOLDS.OPENAI.SEXUAL;
            severity = score > 0.7 ? "critical" : "high";
            break;
          case "sexual/minors":
            threshold = AI_THRESHOLDS.OPENAI.SEXUAL;
            severity = "critical";
            break;
          case "violence":
            threshold = AI_THRESHOLDS.OPENAI.VIOLENCE;
            severity = score > 0.7 ? "critical" : "high";
            break;
          case "violence/graphic":
            threshold = AI_THRESHOLDS.OPENAI.VIOLENCE;
            severity = "critical";
            break;
        }

        if (score > threshold) {
          violations.push({
            type: category.replace("/", "_"),
            score: score,
            flagged: result.categories[category],
            severity: severity,
            source: "openai_image",
            applied_input_types: appliedInputTypes,
          });
        }
      }
    });

    const isClean = violations.length === 0;
    const confidence = isClean
      ? 0.95
      : Math.max(...violations.map((v) => v.score));

    console.log(`🤖 OpenAI Image Analysis Result:`, {
      isClean,
      violations: violations.length,
      confidence: confidence.toFixed(3),
      flagged: result.flagged,
      model: "omni-moderation-latest",
    });

    return {
      isClean,
      confidence,
      violations,
      severity: determineSeverity(violations),
      details: {
        openai_image: {
          model: "omni-moderation-latest",
          flagged: result.flagged,
          categories: result.categories,
          category_scores: result.category_scores,
          category_applied_input_types: result.category_applied_input_types,
        },
      },
    };
  } catch (error) {
    console.error("OpenAI image moderation error:", error.message);
    return null;
  }
};

/**
 * Detect MIME type from image buffer
 * @param {Buffer} buffer - Image buffer
 * @returns {string|null} MIME type or null if unknown
 */
const detectImageMimeType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return null;

  // Check file signatures
  const signatures = [
    { bytes: [0xff, 0xd8, 0xff], mimeType: "image/jpeg" },
    { bytes: [0x89, 0x50, 0x4e, 0x47], mimeType: "image/png" },
    { bytes: [0x47, 0x49, 0x46, 0x38], mimeType: "image/gif" },
    { bytes: [0x52, 0x49, 0x46, 0x46], mimeType: "image/webp" }, // RIFF (WebP)
    { bytes: [0x42, 0x4d], mimeType: "image/bmp" },
  ];

  for (const sig of signatures) {
    if (buffer.length >= sig.bytes.length) {
      const match = sig.bytes.every((byte, index) => buffer[index] === byte);
      if (match) return sig.mimeType;
    }
  }

  return null;
};

export { analyzeImageWithOpenAI };

/**
 * Determine severity based on violations
 */
const determineSeverity = (violations) => {
  if (!violations || violations.length === 0) return "none";

  const severities = violations.map((v) => v.severity);

  if (severities.includes("critical")) return "critical";
  if (severities.includes("high")) return "high";
  if (severities.includes("medium")) return "medium";
  return "low";
};

/**
 * Calculate confidence based on violations
 */
const calculateConfidence = (violations) => {
  if (!violations || violations.length === 0) return 1.0;

  const scores = violations.map((v) => v.score || 0.5);
  return Math.max(...scores);
};

/**
 * Clean text by removing inappropriate content (AI-based replacement)
 */
export const cleanText = (text, options = {}) => {
  if (!text || typeof text !== "string") return text;

  // For AI-first approach, we don't do automatic cleaning
  // Instead, we return the original text and let the analysis determine if it should be blocked
  console.log(
    "⚠️ AI-first approach: Text cleaning disabled. Use analyzeTextContent to check content."
  );
  return text;
};

/**
 * Check file type based on extension
 */
export const checkFileType = (file) => {
  try {
    console.log("🔍 Checking file type:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Get file extension from original name
    const ext = file.originalname.split(".").pop().toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "gif", "webp"];

    if (!allowedExts.includes(ext)) {
      return {
        isAllowed: false,
        reason: `File type .${ext} is not allowed. Please use: ${allowedExts.join(
          ", "
        )}`,
        type: null,
      };
    }

    // Map file extensions to MIME types
    const mimeTypeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };

    const expectedMimeType = mimeTypeMap[ext];
    const actualMimeType = file.mimetype.toLowerCase();

    // Accept the file if either:
    // 1. The MIME type matches exactly what we expect based on extension
    // 2. The MIME type is a valid image type (some browsers might send slightly different MIME types)
    const validMimeTypes = Object.values(mimeTypeMap);
    if (validMimeTypes.includes(actualMimeType)) {
      return {
        isAllowed: true,
        type: "image",
        mimeType: actualMimeType,
        extension: ext,
      };
    }

    return {
      isAllowed: false,
      reason: `Invalid file type. Expected ${expectedMimeType} for .${ext} file, got ${actualMimeType}`,
      type: null,
    };
  } catch (error) {
    console.error("Error checking file type:", error);
    return {
      isAllowed: false,
      reason: "Error validating file type",
      type: null,
    };
  }
};

/**
 * Main content checking function
 */
export const checkContent = async (text, type = "text", userId = null) => {
  try {
    const result = await analyzeCombinedContent({ text });

    if (!result.isClean && userId) {
      // Update trust score instead of banning
      await updateTrustScore(userId, {
        type: type,
        severity: result.severity,
        reason: `Content violation in ${type}`,
      });

      // Get user's current trust status
      const trustStatus = await checkTrustStatus(userId);

      // Log violation but don't ban
      await logContentViolation(type, userId, result);

      return {
        allowed: true, // Always allow but with reduced trust
        trustScore: trustStatus.trustScore,
        warnings: trustStatus.warnings,
        requiresModeration: trustStatus.requiresModeration,
        message:
          trustStatus.trustScore < 30
            ? "Warning: Your trust score is low. Further violations may restrict your actions."
            : "Content posted with reduced trust score.",
        filterResult: result,
      };
    }

    return {
      allowed: true,
      filterResult: result,
    };
  } catch (error) {
    console.error("Content check error:", error);
    throw error;
  }
};

/**
 * Filter post content using AI analysis
 */
export const filterPostContent = async (postData, userId) => {
  const results = {
    isClean: true,
    confidence: 1.0,
    violations: [],
    severity: "none",
    details: {},
  };

  try {
    // Check user's trust status first
    if (userId) {
      const trustStatus = await checkTrustStatus(userId);
      if (trustStatus.isBanned) {
        return {
          isClean: false,
          confidence: 1.0,
          violations: [
            {
              type: "banned_user",
              severity: "critical",
              reason: trustStatus.banReason,
              source: "trust_system",
            },
          ],
          severity: "critical",
          details: { trustStatus },
        };
      }
    }

    // Analyze text content if present
    if (postData.desc && postData.desc.trim()) {
      const textResult = await analyzeTextContent(postData.desc, {
        contentType: "post",
      });
      if (!textResult.isClean) {
        results.isClean = false;
        results.violations.push(...textResult.violations);
        results.details.text = textResult.details;
      }
    }

    // Analyze image if present
    if (postData.img) {
      const imageResult = await analyzeImageContent(postData.img);
      if (!imageResult.isClean) {
        results.isClean = false;
        results.violations.push(...imageResult.violations);
        results.details.image = imageResult.details;
      }
    }

    // Determine overall result
    if (results.violations.length > 0) {
      results.severity = determineSeverity(results.violations);
      results.confidence = calculateConfidence(results.violations);

      // Update trust score if violations found and userId provided
      if (userId) {
        const trustUpdate = await updateTrustScore(userId, {
          severity: results.severity,
          type: results.violations[0].type,
          reason: results.violations[0].reason,
        });
        results.details.trustUpdate = trustUpdate;
      }
    }

    return results;
  } catch (error) {
    console.error("Post filtering error:", error.message);
    return {
      isClean: false,
      confidence: 0.1,
      violations: [
        {
          type: "filter_error",
          severity: "medium",
          source: "system",
          reason: "Post filtering failed - blocked for safety",
        },
      ],
      severity: "medium",
      details: { error: error.message },
    };
  }
};

/**
 * Filter comment content using AI analysis
 */
export const filterCommentContent = async (commentData) => {
  if (!commentData.desc || !commentData.desc.trim()) {
    return { isClean: true, confidence: 1.0 };
  }

  try {
    const result = await analyzeTextContent(commentData.desc, {
      contentType: "comment",
    });
    return result;
  } catch (error) {
    console.error("Comment filtering error:", error.message);
    return {
      isClean: false,
      confidence: 0.1,
      violations: [
        {
          type: "filter_error",
          severity: "medium",
          source: "system",
          reason: "Comment filtering failed - blocked for safety",
        },
      ],
      severity: "medium",
      details: { error: error.message },
    };
  }
};

/**
 * Filter user content using AI analysis
 */
export const filterUserContent = async (userData) => {
  const results = {
    isClean: true,
    confidence: 1.0,
    violations: [],
    severity: "none",
    details: {},
  };

  try {
    const analysisPromises = [];

    // Analyze username
    if (userData.username) {
      analysisPromises.push(
        analyzeTextContent(userData.username, { contentType: "username" }).then(
          (result) => ({ field: "username", result })
        )
      );
    }

    // Analyze name
    if (userData.name) {
      analysisPromises.push(
        analyzeTextContent(userData.name, { contentType: "name" }).then(
          (result) => ({ field: "name", result })
        )
      );
    }

    // Analyze email
    if (userData.email) {
      analysisPromises.push(
        analyzeTextContent(userData.email, { contentType: "email" }).then(
          (result) => ({ field: "email", result })
        )
      );
    }

    // Wait for all analyses to complete
    const analysisResults = await Promise.all(analysisPromises);

    // Process results
    analysisResults.forEach(({ field, result }) => {
      if (!result.isClean) {
        results.isClean = false;
        results.violations.push(
          ...result.violations.map((v) => ({ ...v, field }))
        );
        results.details[field] = result.details;
      }
    });

    // Determine overall result
    if (results.violations.length > 0) {
      results.severity = determineSeverity(results.violations);
      results.confidence = calculateConfidence(results.violations);
    }

    return results;
  } catch (error) {
    console.error("User filtering error:", error.message);
    return {
      isClean: false,
      confidence: 0.1,
      violations: [
        {
          type: "filter_error",
          severity: "medium",
          source: "system",
          reason: "User filtering failed - blocked for safety",
        },
      ],
      severity: "medium",
      details: { error: error.message },
    };
  }
};

/**
 * Log content violation for admin dashboard
 */
export const logContentViolation = (
  type,
  userId,
  filterResult,
  originalData
) => {
  try {
    // Only log if there are actual violations
    if (
      !filterResult ||
      !filterResult.violations ||
      filterResult.violations.length === 0
    ) {
      console.log("No violations to log - content is clean");
      return;
    }

    const violation = {
      type,
      userId,
      timestamp: new Date().toISOString(),
      severity: filterResult.severity || "none",
      confidence: filterResult.confidence || 1.0,
      violations: filterResult.violations || [],
      content: {
        preview:
          typeof originalData === "string"
            ? originalData.substring(0, 100)
            : JSON.stringify(originalData).substring(0, 100),
        type: typeof originalData,
      },
      aiSources:
        filterResult.violations && filterResult.violations.length > 0
          ? [
              ...new Set(
                filterResult.violations.map((v) => v.source).filter(Boolean)
              ),
            ]
          : [],
    };

    addViolation(violation);
    console.log(`📊 Content violation logged:`, {
      type,
      userId,
      severity: filterResult.severity,
      sources: violation.aiSources,
    });
  } catch (error) {
    console.error("Failed to log content violation:", error.message);
  }
};

/**
 * Legacy function for backward compatibility
 */
export const filterTextContent = async (text) => {
  return await analyzeTextContent(text);
};

// Simple alias for backward compatibility
export const filterContent = async (text) => {
  return await analyzeTextContent(text);
};

// Export AI threshold constants for external use
export { AI_THRESHOLDS };

/**
 * Main text content analysis function using AI models only
 * @param {string} text - Text content to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeTextContent = async (text, options = {}) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return { isClean: true, confidence: 1.0 };
  }

  const results = {
    isClean: true,
    confidence: 1.0,
    violations: [],
    severity: "none",
    details: {},
  };

  try {
    console.log(
      `🔍 Analyzing text content: "${text.substring(0, 50)}${
        text.length > 50 ? "..." : ""
      }"`
    );

    // For usernames and names, use more lenient AI thresholds
    const contentType = options.contentType || "text";
    const isNameContent = ["username", "name", "display_name"].includes(
      contentType
    );

    if (isNameContent) {
      console.log(`📝 Analyzing ${contentType} with lenient AI thresholds`);
    }

    // Primary: OpenAI Analysis
    const openAIResult = await analyzeWithOpenAI(text, options);

    if (openAIResult && !openAIResult.isClean) {
      // Apply lenient thresholds for names
      if (isNameContent) {
        // Only block extremely problematic content for names
        const severeViolations = openAIResult.violations.filter(
          (v) => v.severity === "critical" || v.score > 0.8
        );
        if (severeViolations.length > 0) {
          results.violations.push(...severeViolations);
          results.details.openai = openAIResult.details.openai;
        }
      } else {
        results.violations.push(...openAIResult.violations);
        results.details.openai = openAIResult.details.openai;
      }
    }

    // Only use Perspective API if OpenAI didn't find any violations
    if (
      results.violations.length === 0 &&
      process.env.GOOGLE_PERSPECTIVE_API_KEY
    ) {
      const perspectiveResult = await analyzeToxicityWithPerspective(text);
      if (perspectiveResult && !perspectiveResult.isClean) {
        // Apply lenient thresholds for names
        if (isNameContent) {
          // Use higher thresholds for names (only block extremely toxic content)
          const nameThresholds = {
            toxicity: 0.9,
            severe_toxicity: 0.8,
            identity_attack: 0.8,
            threat: 0.7,
            sexually_explicit: 0.8,
          };

          const severeViolations = perspectiveResult.violations.filter((v) => {
            const threshold = nameThresholds[v.type] || 0.9;
            return v.score > threshold;
          });

          if (severeViolations.length > 0) {
            results.violations.push(...severeViolations);
            results.details.perspective = perspectiveResult.details.perspective;
          }
        } else {
          results.violations.push(...perspectiveResult.violations);
          results.details.perspective = perspectiveResult.details.perspective;
        }
      }
    }

    // Determine final result
    if (results.violations.length > 0) {
      results.isClean = false;
      results.severity = determineSeverity(results.violations);
      results.confidence = calculateConfidence(results.violations);
    }

    // Log analysis summary
    console.log(`✅ AI Analysis Complete:`, {
      isClean: results.isClean,
      violations: results.violations.length,
      severity: results.severity,
      confidence: results.confidence.toFixed(3),
      sources: [...new Set(results.violations.map((v) => v.source))],
    });

    return results;
  } catch (error) {
    console.error("Text analysis error:", error.message);

    // Conservative approach: if AI analysis fails, consider content suspicious
    return {
      isClean: false,
      confidence: 0.1,
      violations: [
        {
          type: "analysis_error",
          severity: "medium",
          source: "system",
          reason: "AI analysis failed - content blocked for safety",
        },
      ],
      severity: "medium",
      details: { error: error.message },
    };
  }
};

/**
 * Analyze image content using OpenAI's omni-moderation-latest API
 * @param {Buffer|string} imageData - Image buffer, file path, or base64 data URL
 * @returns {Promise<Object>} Analysis result
 */
const analyzeImageContent = async (imageData) => {
  try {
    console.log("🔍 Analyzing image content with OpenAI omni-moderation");

    const results = {
      isClean: true,
      confidence: 1.0,
      violations: [],
      severity: "none",
      details: {},
    };

    // Convert image data to base64 URL if it's a buffer
    let imageUrl = null;
    if (Buffer.isBuffer(imageData)) {
      // Convert buffer to base64 data URL
      const base64 = imageData.toString("base64");
      // Detect image type (default to jpeg if unknown)
      const mimeType = detectImageMimeType(imageData) || "image/jpeg";
      imageUrl = `data:${mimeType};base64,${base64}`;
    } else if (typeof imageData === "string") {
      // Assume it's already a URL or base64 data URL
      imageUrl = imageData;
    }

    // Primary: OpenAI omni-moderation for images
    if (openai && imageUrl) {
      const openAIResult = await analyzeImageWithOpenAI(imageUrl);
      if (openAIResult && !openAIResult.isClean) {
        results.violations.push(...openAIResult.violations);
        results.details.openai_image = openAIResult.details.openai_image;
      }
    }

    // Determine final result
    if (results.violations.length > 0) {
      results.isClean = false;
      results.severity = determineSeverity(results.violations);
      results.confidence = calculateConfidence(results.violations);
    }

    console.log("✅ Image Analysis Complete:", {
      isClean: results.isClean,
      violations: results.violations.length,
      severity: results.severity,
      confidence: results.confidence.toFixed(3),
      sources: [...new Set(results.violations.map((v) => v.source))],
    });

    return results;
  } catch (error) {
    console.error("❌ Image analysis error:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
};

// Export functions for image analysis
export { analyzeImageContent };
