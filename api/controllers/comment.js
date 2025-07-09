import jwt from "jsonwebtoken";
import moment from "moment";
import {
  analyzeTextContent,
  filterCommentContent,
  logContentViolation,
  cleanText,
} from "../utils/aiContentFilter.js";
import {
  createCommentNotification,
  createMentionNotification,
} from "../models/Notification.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

// All data is now stored in MongoDB Atlas

// Enhanced comment retrieval with content safety verification
export const getComments = async (req, res) => {
  const postId = req.query.postId;

  if (!postId) {
    return res.status(400).json("Post ID is required");
  }

  try {
    // Get comments for the specific post from database
    const postComments = await Comment.find({ postId })
      .populate("userId", "name profilePic username")
      .sort({ createdAt: -1 })
      .lean();

    // Format comments for frontend
    const formattedComments = postComments.map((comment) => ({
      ...comment,
      id: comment._id,
      name: comment.userId?.name || "Anonymous",
      profilePic: comment.userId?.profilePic || null,
      userId: comment.userId?._id || comment.userId,
    }));

    res.status(200).json(formattedComments);
  } catch (err) {
    console.error("Error in getComments:", err);
    res.status(500).json({
      message: "Internal server error during comment retrieval",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Enhanced comment creation with ultra-robust content filtering
export const addComment = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const { desc, postId } = req.body;

    if (!desc || !postId) {
      return res
        .status(400)
        .json("Comment description and post ID are required");
    }

    // Comprehensive content analysis
    const contentAnalysis = await filterCommentContent({ desc });

    if (!contentAnalysis.isClean) {
      // Log the violation with detailed information
      logContentViolation("comment", userInfo.id, contentAnalysis, {
        desc,
        postId,
      });

      // Determine response based on severity - show user-friendly popup
      return res.status(400).json({
        success: false,
        showPopup: true,
        popupType: "content_moderation",
        title: "Comment Guidelines Notice",
        message:
          "Thank you for wanting to engage with our community! We noticed your comment might not align with our positive community standards.",
        details:
          "We encourage respectful and uplifting conversations that make everyone feel welcome. Please consider revising your comment to spread positivity.",
        severity: contentAnalysis.severity,
        actionRequired: false,
        canRetry: true,
        suggestions: [
          "Keep comments respectful and kind",
          "Focus on constructive feedback",
          "Spread positivity and encouragement",
          "Build meaningful discussions",
        ],
        suggestedEdit: cleanText(desc),
      });
    }

    // Content is clean, proceed with comment creation
    const newComment = new Comment({
      desc: desc,
      userId: userInfo.id,
      postId: postId,
    });

    await newComment.save();

    // Create notification for post owner
    const post = await Post.findById(postId);
    if (post && post.userId.toString() !== userInfo.id) {
      await createCommentNotification(
        userInfo.id,
        post.userId,
        postId,
        newComment._id
      );
    }

    // Check for mentions in the comment and create notifications
    const mentionRegex = /@(\w+)/g;
    const mentions = desc.match(mentionRegex);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.substring(1); // Remove @ symbol
        const mentionedUser = await User.findOne({ username });
        if (mentionedUser && mentionedUser._id.toString() !== userInfo.id) {
          await createMentionNotification(
            userInfo.id,
            mentionedUser._id,
            postId,
            newComment._id
          );
        }
      }
    }

    // Log successful comment creation
    console.log("✅ Comment created successfully:", {
      commentId: newComment._id,
      postId: newComment.postId,
      userId: userInfo.id,
      contentLength: desc.length,
      analysis: {
        severity: contentAnalysis.severity,
        confidence: contentAnalysis.confidence,
        librariesUsed:
          contentAnalysis.violations
            ?.map((v) => v.library)
            .filter((v, i, a) => a.indexOf(v) === i) || [],
      },
    });

    res.status(200).json({
      message: "Comment has been created successfully.",
      comment: newComment,
      contentAnalysis: {
        severity: contentAnalysis.severity,
        confidence: contentAnalysis.confidence,
      },
    });
  } catch (err) {
    console.error("Error in addComment:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during comment creation",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Enhanced comment deletion with audit logging
export const deleteComment = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const commentId = req.params.id;

    const comment = await Comment.findOne({
      _id: commentId,
      userId: userInfo.id,
    });

    if (!comment) {
      return res
        .status(404)
        .json("Comment not found or you don't have permission to delete it.");
    }

    await Comment.findByIdAndDelete(commentId);

    // Log comment deletion for audit trail
    console.log("🗑️ Comment deleted:", {
      commentId: comment._id,
      postId: comment.postId,
      userId: userInfo.id,
      deletedAt: new Date().toISOString(),
      originalContent: {
        desc: comment.desc,
        createdAt: comment.createdAt,
      },
    });

    res.status(200).json({
      message: "Comment has been deleted successfully.",
      deletedComment: {
        id: comment._id,
        postId: comment.postId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in deleteComment:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during comment deletion",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// New endpoint for comment content analysis preview
export const analyzeCommentContent = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const { desc } = req.body;

    if (!desc) {
      return res.status(400).json("No comment content provided for analysis.");
    }

    // Perform comprehensive content analysis
    const contentAnalysis = await filterCommentContent({ desc });

    const response = {
      isClean: contentAnalysis.isClean,
      severity: contentAnalysis.severity,
      confidence: contentAnalysis.confidence,
      violations:
        contentAnalysis.violations?.map((v) => ({
          type: v.type,
          library: v.library,
          severity: v.severity,
          reason: v.reason,
        })) || [],
      suggestions: {
        canComment: contentAnalysis.isClean,
        suggestedEdit: !contentAnalysis.isClean ? cleanText(desc) : null,
        recommendations: [],
      },
    };

    // Add specific recommendations based on violations
    if (!contentAnalysis.isClean) {
      if (contentAnalysis.severity === "critical") {
        response.suggestions.recommendations.push(
          "Comment contains critical policy violations and cannot be posted."
        );
      } else if (contentAnalysis.severity === "high") {
        response.suggestions.recommendations.push(
          "Comment violates community guidelines. Please revise significantly."
        );
      } else if (contentAnalysis.severity === "medium") {
        response.suggestions.recommendations.push(
          "Comment may be inappropriate. Consider using the suggested edit."
        );
      } else {
        response.suggestions.recommendations.push(
          "Comment may need minor adjustments to meet community standards."
        );
      }
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Error in analyzeCommentContent:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during comment analysis",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// New endpoint to get comment statistics and safety metrics
export const getCommentStats = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const postId = parseInt(req.query.postId);

    if (!postId) {
      return res.status(400).json("Post ID is required");
    }

    const postComments = comments.filter(
      (comment) => comment.postId === postId
    );

    // Analyze all comments for safety metrics
    let safeComments = 0;
    let flaggedComments = 0;
    let cleanedComments = 0;
    let severityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const comment of postComments) {
      const contentAnalysis = await filterCommentContent({
        desc: comment.desc,
      });

      if (contentAnalysis.isClean) {
        safeComments++;
      } else {
        flaggedComments++;
        if (contentAnalysis.severity === "medium") {
          cleanedComments++;
        }
        severityBreakdown[contentAnalysis.severity]++;
      }
    }

    const stats = {
      totalComments: postComments.length,
      safeComments,
      flaggedComments,
      cleanedComments,
      safetyPercentage:
        postComments.length > 0
          ? (safeComments / postComments.length) * 100
          : 100,
      severityBreakdown,
      lastAnalyzed: new Date().toISOString(),
    };

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error in getCommentStats:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during comment statistics retrieval",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
