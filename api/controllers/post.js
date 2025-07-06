import jwt from "jsonwebtoken";
import moment from "moment";
import {
  analyzeTextContent,
  filterPostContent,
  logContentViolation,
  cleanText,
  analyzeImageContent,
} from "../utils/aiContentFilter.js";
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
    console.log("🔒 Verifying user token...");
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    console.log("✅ Token verified for user:", userInfo.id);

    const { desc } = req.body;
    let imgUrl = null;

    // Handle file upload to Cloudinary if present
    if (req.file) {
      try {
        console.log("📦 Processing file upload:", {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          buffer: req.file.buffer
            ? `${req.file.buffer.length} bytes`
            : "Missing",
          fieldname: req.file.fieldname,
          encoding: req.file.encoding,
          headers: req.headers,
          body: Object.keys(req.body),
        });

        if (!req.file.buffer) {
          console.error("❌ No file buffer received");
          throw new Error("No file buffer received");
        }

        if (req.file.buffer.length === 0) {
          console.error("❌ Empty file buffer received");
          throw new Error("Empty file buffer received");
        }

        // Analyze image content before upload
        console.log("🔍 Analyzing image content...");
        const imageAnalysis = await analyzeImageContent(req.file.buffer);

        if (!imageAnalysis.isClean) {
          console.error("❌ Image content violation detected:", imageAnalysis);
          logContentViolation("image", userInfo.id, imageAnalysis, {
            filename: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
          });

          return res.status(403).json({
            message: "Image content violates community guidelines",
            severity: imageAnalysis.severity,
            confidence: imageAnalysis.confidence,
            violations: imageAnalysis.violations,
          });
        }

        // Get transformation parameters from request
        const transformations = {
          width: parseInt(req.body.transform_width) || 800,
          height: parseInt(req.body.transform_height) || 600,
          crop: req.body.transform_crop || "fill",
          gravity: req.body.transform_gravity || "auto",
          quality: parseInt(req.body.transform_quality) || 90,
          format: req.body.transform_format || "jpg",
        };

        console.log(
          "📤 Uploading to Cloudinary with transformations:",
          transformations
        );
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          "posivibe/posts",
          transformations
        ).catch((error) => {
          console.error("❌ Cloudinary upload failed:", {
            error: error.message,
            stack: error.stack,
            details: error.details,
          });
          throw error;
        });

        imgUrl = cloudinaryResult.secure_url;

        console.log("✅ Image upload successful:", {
          url: imgUrl,
          publicId: cloudinaryResult.public_id,
          size: cloudinaryResult.bytes,
          format: cloudinaryResult.format,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          transformations: cloudinaryResult.transformation,
        });
      } catch (uploadError) {
        console.error("❌ Image upload failed:", {
          error: uploadError.message,
          stack: uploadError.stack,
          filename: req.file?.originalname,
          size: req.file?.size,
          mimetype: req.file?.mimetype,
          buffer: req.file?.buffer
            ? `${req.file.buffer.length} bytes`
            : "Missing",
          fieldname: req.file?.fieldname,
          body: Object.keys(req.body),
        });
        return res.status(400).json({
          message: "Failed to upload image: " + uploadError.message,
          details: {
            filename: req.file?.originalname,
            size: req.file?.size,
            type: req.file?.mimetype,
            field: req.file?.fieldname,
          },
          error:
            process.env.NODE_ENV === "development"
              ? uploadError.stack
              : undefined,
        });
      }
    }

    console.log("🔍 Analyzing content...");
    const contentAnalysis = await filterPostContent(
      { desc, img: imgUrl },
      userInfo.id
    );
    console.log("✅ Content analysis complete:", {
      isClean: contentAnalysis.isClean,
      severity: contentAnalysis.severity,
      confidence: contentAnalysis.confidence,
    });

    if (!contentAnalysis.isClean) {
      // Log the violation with detailed information
      logContentViolation("post", userInfo.id, contentAnalysis, {
        desc,
        img: imgUrl,
      });
      console.log("❌ Content violation detected:", {
        severity: contentAnalysis.severity,
        confidence: contentAnalysis.confidence,
        violations: contentAnalysis.violations,
      });

      // If user is banned (trust score 0), block all actions
      if (contentAnalysis.details?.trustUpdate?.isBanned) {
        return res.status(403).json({
          message:
            "Your account has been suspended due to multiple violations. Please contact an administrator.",
          severity: "critical",
          isBanned: true,
          trustScore: 0,
        });
      }

      // For other violations, show warning with trust score impact
      const trustUpdate = contentAnalysis.details?.trustUpdate;
      const warningMessage = {
        message: "Content flagged for violation.",
        severity: contentAnalysis.severity,
        trustScore: {
          current: trustUpdate?.newTrustScore || null,
          penalty: trustUpdate?.penalty || null,
        },
        suggestedEdit: desc ? cleanText(desc) : null,
        canRetry: true,
      };

      // Add severity-specific messages
      if (contentAnalysis.severity === "critical") {
        warningMessage.message =
          "Critical content violation detected. Your trust score has been significantly reduced.";
      } else if (contentAnalysis.severity === "high") {
        warningMessage.message =
          "Serious content violation detected. This has impacted your trust score.";
      } else if (contentAnalysis.severity === "medium") {
        warningMessage.message =
          "Content violation detected. Please review our community guidelines.";
      } else {
        warningMessage.message =
          "Minor content violation detected. Please be mindful of our community guidelines.";
      }

      return res.status(403).json(warningMessage);
    }

    // Content is clean, proceed with post creation
    console.log("📝 Creating new post...");
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
    console.error("❌ Error in addPost:", {
      error: err.message,
      stack: err.stack,
      type: err.name,
      code: err.code,
    });

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

    let query = {};

    if (userId) {
      // If requesting a specific user's posts, show only their posts
      query.userId = userId;
    } else {
      // For the main feed, show only posts from followed users + own posts

      // Get list of users that the current user follows
      const followedUsers = await Relationship.find({
        followerUserId: userInfo.id,
      }).select("followedUserId");

      // Extract the user IDs from the relationships
      const followedUserIds = followedUsers.map((rel) => rel.followedUserId);

      // Include the current user's own posts as well
      followedUserIds.push(userInfo.id);

      // Query posts only from followed users and self
      query.userId = { $in: followedUserIds };

      console.log(
        `📋 Feed for user ${userInfo.id}: showing posts from ${followedUserIds.length} users (${followedUsers.length} followed + self)`
      );
    }

    // Get posts from database with user information
    const posts = await Post.find(query)
      .populate("userId", "name profilePic username")
      .sort({ createdAt: -1 })
      .lean();

    // Format posts for frontend with better error handling
    const formattedPosts = posts.map((post) => {
      // Handle cases where populate might fail or user might be deleted
      const userData = post.userId;

      return {
        ...post,
        id: post._id,
        name: userData?.name || "Unknown User",
        profilePic: userData?.profilePic || null,
        username: userData?.username || null,
        userId: userData?._id || post.userId, // Keep original userId if populate failed
        // Add debug info in development
        ...(process.env.NODE_ENV === "development" && {
          _debug: {
            originalUserId: post.userId,
            populatedUser: userData,
            hasUserData: !!userData,
          },
        }),
      };
    });

    // Log debug info for troubleshooting
    if (process.env.NODE_ENV === "development" && formattedPosts.length > 0) {
      console.log("📋 Post formatting debug:", {
        totalPosts: formattedPosts.length,
        firstPost: {
          id: formattedPosts[0].id,
          name: formattedPosts[0].name,
          hasUserData: !!formattedPosts[0]._debug?.hasUserData,
          originalUserId: formattedPosts[0]._debug?.originalUserId,
        },
      });
    }

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
