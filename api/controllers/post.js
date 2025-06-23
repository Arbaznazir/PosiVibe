import jwt from "jsonwebtoken";
import moment from "moment";
import {
  analyzeTextContent,
  filterPostContent,
  logContentViolation,
  cleanText,
} from "../utils/contentFilter.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Relationship from "../models/Relationship.js";

// All data is now stored in MongoDB Atlas

// Enhanced post creation with ultra-robust content filtering
export const addPost = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const { desc } = req.body;
    let imgUrl = null;

    // Handle file upload to Cloudinary if present
    if (req.file) {
      try {
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          "posivibe/posts"
        );
        imgUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(400).json({
          message: "Failed to upload image",
          error: uploadError.message,
        });
      }
    }

    // Comprehensive content analysis
    const contentAnalysis = await filterPostContent({ desc, img: imgUrl });

    if (!contentAnalysis.isClean) {
      // Log the violation with detailed information
      logContentViolation("post", userInfo.id, contentAnalysis, { desc, img });

      // Determine response based on severity
      if (contentAnalysis.severity === "critical") {
        return res.status(403).json({
          message:
            "Content blocked due to critical policy violation. Account flagged for review.",
          severity: contentAnalysis.severity,
          confidence: contentAnalysis.confidence,
          violationCount: contentAnalysis.violations?.length || 1,
        });
      } else if (contentAnalysis.severity === "high") {
        return res.status(403).json({
          message:
            "Content blocked due to policy violation. Please review our community guidelines.",
          severity: contentAnalysis.severity,
          confidence: contentAnalysis.confidence,
          suggestedEdit: desc ? cleanText(desc) : null,
        });
      } else if (contentAnalysis.severity === "medium") {
        return res.status(403).json({
          message: "Content blocked. Please revise your post.",
          severity: contentAnalysis.severity,
          suggestedEdit: desc ? cleanText(desc) : null,
        });
      } else {
        return res.status(403).json({
          message:
            "Content may violate community guidelines. Please review and try again.",
          severity: contentAnalysis.severity,
          suggestedEdit: desc ? cleanText(desc) : null,
        });
      }
    }

    // Content is clean, proceed with post creation
    const newPost = new Post({
      desc: desc || "",
      img: imgUrl || null,
      userId: userInfo.id,
    });

    await newPost.save();

    // Log successful content creation
    console.log("✅ Post created successfully:", {
      postId: newPost._id,
      userId: userInfo.id,
      contentLength: desc?.length || 0,
      hasImage: !!imgUrl,
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
      message: "Post has been created successfully.",
      post: newPost,
      contentAnalysis: {
        severity: contentAnalysis.severity,
        confidence: contentAnalysis.confidence,
      },
    });
  } catch (err) {
    console.error("Error in addPost:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during post creation",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Enhanced post retrieval with content safety verification
export const getPosts = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const userId = req.query.userId;

    // Build query for posts
    let query = {};
    if (userId) {
      query.userId = userId;
    }

    // Get posts from database with user information
    const posts = await Post.find(query)
      .populate("userId", "name profilePic username")
      .sort({ createdAt: -1 })
      .lean();

    // Format posts for frontend
    const formattedPosts = posts.map((post) => ({
      ...post,
      id: post._id,
      name: post.userId?.name || "Unknown User",
      profilePic: post.userId?.profilePic || null,
      userId: post.userId?._id || post.userId,
    }));

    // Return posts array
    res.status(200).json(formattedPosts);
  } catch (err) {
    console.error("Error in getPosts:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during post retrieval",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Enhanced post deletion with audit logging
export const deletePost = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const postId = req.params.id;

    const post = await Post.findOne({
      _id: postId,
      userId: userInfo.id,
    });

    if (!post) {
      return res
        .status(404)
        .json("Post not found or you don't have permission to delete it.");
    }

    await Post.findByIdAndDelete(postId);

    // Log post deletion for audit trail
    console.log("🗑️ Post deleted:", {
      postId: post._id,
      userId: userInfo.id,
      deletedAt: new Date().toISOString(),
      originalContent: {
        desc: post.desc,
        img: post.img,
        createdAt: post.createdAt,
      },
    });

    res.status(200).json({
      message: "Post has been deleted successfully.",
      deletedPost: {
        id: post._id,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in deletePost:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during post deletion",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// New endpoint for content analysis preview (helps users understand what might be blocked)
export const analyzeContent = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const { desc, img } = req.body;

    if (!desc && !img) {
      return res.status(400).json("No content provided for analysis.");
    }

    // Perform comprehensive content analysis
    const contentAnalysis = await filterPostContent({ desc, img });

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
        canPost: contentAnalysis.isClean,
        suggestedEdit:
          desc && !contentAnalysis.isClean ? cleanText(desc) : null,
        recommendations: [],
      },
    };

    // Add specific recommendations based on violations
    if (!contentAnalysis.isClean) {
      if (contentAnalysis.severity === "critical") {
        response.suggestions.recommendations.push(
          "Content contains critical policy violations and cannot be posted."
        );
      } else if (contentAnalysis.severity === "high") {
        response.suggestions.recommendations.push(
          "Content violates community guidelines. Please revise significantly."
        );
      } else if (contentAnalysis.severity === "medium") {
        response.suggestions.recommendations.push(
          "Content may be inappropriate. Consider using the suggested edit."
        );
      } else {
        response.suggestions.recommendations.push(
          "Content may need minor adjustments to meet community standards."
        );
      }
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Error in analyzeContent:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Invalid token!");
    }
    res.status(500).json({
      message: "Internal server error during content analysis",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
