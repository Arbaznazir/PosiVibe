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
import {
  updateTrustScore,
  checkTrustStatus,
} from "../utils/trustScoreManager.js";

// All data is now stored in MongoDB Atlas

// Enhanced post creation with ultra-robust content filtering
export const addPost = async (req, res) => {
  try {
    console.log("✅ User authenticated:", req.userInfo.id);
    const userId = req.userInfo.id;

    // Check trust status first
    const trustStatus = await checkTrustStatus(userId);

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
          console.log("⚠️ Image content violation detected:", imageAnalysis);
          logContentViolation("image", userId, imageAnalysis, {
            filename: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
          });

          // Return user-friendly popup response instead of harsh error
          return res.status(400).json({
            showPopup: true,
            popupType: "content_moderation",
            title: "Image Guidelines Notice",
            message:
              "We appreciate your contribution! Let's make sure your image aligns with our positive community values.",
            details:
              "Your image contains content that doesn't meet our community guidelines. Please choose a different image and try again.",
            suggestions: [
              "Share positive and uplifting images",
              "Avoid violent or disturbing content",
              "Choose images that inspire and connect people",
              "Make sure images are appropriate for all audiences",
              "Focus on building a positive community",
            ],
            severity: imageAnalysis.severity === "critical" ? "high" : "medium",
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
      userId
    );
    console.log("✅ Content analysis complete:", {
      isClean: contentAnalysis.isClean,
      severity: contentAnalysis.severity,
      confidence: contentAnalysis.confidence,
    });

    if (!contentAnalysis.isClean) {
      // Update trust score for violation
      const trustUpdate = await updateTrustScore(userId, {
        type: "post",
        severity: contentAnalysis.severity,
        reason: "Content violation in post",
      });

      // Return user-friendly popup response
      return res.status(400).json({
        showPopup: true,
        popupType: "content_moderation",
        title: "Content Guidelines Notice",
        message:
          "We appreciate your contribution! Let's make sure your content aligns with our positive community values.",
        details:
          "Your post contains content that doesn't meet our community guidelines. Please review and try again.",
        suggestions: [
          "Use encouraging and positive language",
          "Share uplifting and inspiring content",
          "Avoid controversial or negative topics",
          "Focus on building connections and community",
          "Be respectful and kind to all users",
        ],
        severity: "medium",
      });
    }

    // Create and save the post
    const newPost = new Post({
      userId: userId,
      desc: desc,
      img: imgUrl,
      createdAt: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
    });

    await newPost.save();

    // Return success without trust score
    return res.status(200).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error in addPost:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Enhanced post retrieval with content safety verification
export const getPosts = async (req, res) => {
  try {
    const userId = req.query.userId;
    const currentUserId = req.userInfo.id;

    let query = {};

    if (userId) {
      // If requesting a specific user's posts, show only their posts
      query.userId = userId;
    } else {
      // For the main feed, show only posts from followed users + own posts

      // Get list of users that the current user follows
      const followedUsers = await Relationship.find({
        followerUserId: currentUserId,
      }).select("followedUserId");

      // Extract the user IDs from the relationships
      const followedUserIds = followedUsers.map((rel) => rel.followedUserId);

      // Include the current user's own posts as well
      followedUserIds.push(currentUserId);

      // Query posts only from followed users and self
      query.userId = { $in: followedUserIds };

      console.log(
        `📋 Feed for user ${currentUserId}: showing posts from ${followedUserIds.length} users (${followedUsers.length} followed + self)`
      );
    }

    // Get posts from database
    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();

    // Manually fetch user data for each post to ensure all fields are included
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          // Fetch full user data
          const userData = await User.findById(post.userId)
            .select("-password")
            .lean();

          return {
            ...post,
            id: post._id,
            name: userData?.name || "Unknown User",
            profilePic: userData?.profilePic || null,
            username: userData?.username || null,
            userId: userData?._id || post.userId,
            isVerified: userData?.isVerified || false,
            verificationBadge: userData?.verificationBadge || null,
            verificationReason: userData?.verificationReason || null,
            // Add debug info in development
            ...(process.env.NODE_ENV === "development" && {
              _debug: {
                originalUserId: post.userId,
                fetchedUser: userData,
                hasUserData: !!userData,
              },
            }),
          };
        } catch (error) {
          console.error("Error fetching user data for post:", post._id, error);
          return {
            ...post,
            id: post._id,
            name: "Unknown User",
            profilePic: null,
            username: null,
            userId: post.userId,
            isVerified: false,
            verificationBadge: null,
            verificationReason: null,
          };
        }
      })
    );

    // Log debug info for troubleshooting
    if (process.env.NODE_ENV === "development" && formattedPosts.length > 0) {
      console.log("📋 Post formatting debug:", {
        totalPosts: formattedPosts.length,
        firstPost: {
          id: formattedPosts[0].id,
          name: formattedPosts[0].name,
          verificationBadge: formattedPosts[0].verificationBadge,
          hasUserData: !!formattedPosts[0]._debug?.hasUserData,
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
  try {
    const currentUserId = req.userInfo.id;
    const postId = req.params.id;

    const post = await Post.findOne({
      _id: postId,
      userId: currentUserId,
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
      userId: currentUserId,
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
  try {
    const currentUserId = req.userInfo.id;
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
