import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
  logContentViolation,
  checkContent,
  checkFileType,
  analyzeImageContent,
  filterPostContent,
} from "../utils/aiContentFilter.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/uploadToCloudinary.js";
import moment from "moment";
import Story from "../models/Story.js";
import User from "../models/User.js";
import Relationship from "../models/Relationship.js";

// All data is now stored in MongoDB Atlas

export const getStories = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
          return res.status(400).json("Invalid user ID");
        }

        // Get relationships - users that current user follows
        const followingRelationships = await Relationship.find({
          followerUserId: userInfo.id,
        });

        const followingIds = followingRelationships.map(
          (rel) => rel.followedUserId
        );
        followingIds.push(userInfo.id); // Include own stories

        // Get non-expired stories from followed users + own stories
        const stories = await Story.find({
          userId: { $in: followingIds },
          expiresAt: { $gt: new Date() }, // Only non-expired stories
        })
          .populate("userId", "name profilePic username")
          .sort({ createdAt: -1 });

        // Group stories by user
        const groupedStories = {};
        stories.forEach((story) => {
          const userId = story.userId._id.toString();
          if (!groupedStories[userId]) {
            groupedStories[userId] = [];
          }
          groupedStories[userId].push({
            _id: story._id,
            id: story._id, // For frontend compatibility
            type: story.type,
            text: story.text,
            media: story.media,
            backgroundColor: story.backgroundColor,
            userId: userId,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
            views: story.views || [],
          });
        });

        // Transform to format expected by frontend
        const formattedStories = Object.keys(groupedStories).map((userId) => {
          const story = stories.find((s) => s.userId._id.toString() === userId);
          const user = story ? story.userId : null;
          const userStories = groupedStories[userId];

          return {
            userId: userId,
            name: user ? user.name : "Unknown User",
            profilePic: user ? user.profilePic : null,
            stories: userStories,
            hasUnseenStories: userStories.some(
              (story) =>
                !story.views.some((view) => view.userId === userInfo.id)
            ),
          };
        });

        // Sort by users with unseen stories first, then by latest story
        formattedStories.sort((a, b) => {
          if (a.hasUnseenStories && !b.hasUnseenStories) return -1;
          if (!a.hasUnseenStories && b.hasUnseenStories) return 1;

          const aLatest = new Date(
            Math.max(...a.stories.map((s) => new Date(s.createdAt)))
          );
          const bLatest = new Date(
            Math.max(...b.stories.map((s) => new Date(s.createdAt)))
          );
          return bLatest - aLatest;
        });

        return res.status(200).json(formattedStories);
      } catch (err) {
        console.error("Get stories error:", err);
        return res.status(500).json(err);
      }
    }
  );
};

export const addStory = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        console.log("Add story - userInfo:", userInfo);
        console.log("Add story - body:", req.body);
        console.log("Add story - files:", req.files);

        const { type, text, backgroundColor } = req.body;

        // Validate story type
        if (!["text", "image"].includes(type)) {
          return res.status(400).json({ error: "Invalid story type" });
        }

        // Validate based on story type
        if (type === "text") {
          if (!text || text.trim().length === 0) {
            return res
              .status(400)
              .json({ error: "Text content is required for text stories" });
          }
          if (text.length > 500) {
            return res
              .status(400)
              .json({ error: "Text content must be less than 500 characters" });
          }

          // Content filter for text - using the same robust filter as posts
          const filterResult = await filterPostContent({ desc: text }, userInfo.id);
          if (!filterResult.isClean) {
            logContentViolation("story", userInfo.id, filterResult, { text });
            return res.status(400).json({
              error: "Content not allowed",
              reason: filterResult.violations && filterResult.violations.length > 0 
                ? filterResult.violations[0].reason 
                : "Inappropriate content detected",
              message:
                "Your story text contains inappropriate content. Please modify your message.",
              severity: filterResult.severity || "medium"
            });
          }
          
          // For text stories
          const storyData = {
            type: "text",
            text: text.trim(),
            backgroundColor: backgroundColor || "#6366f1",
            userId: userInfo.id,
            views: [],
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          };

          // Create story in MongoDB
          const newStory = await Story.create(storyData);
          console.log("✅ Story created (text):", newStory);

          return res.status(200).json({
            message: "Story has been created",
            story: {
              id: newStory._id,
              type: newStory.type,
              text: newStory.text,
              backgroundColor: newStory.backgroundColor,
              createdAt: newStory.createdAt,
              expiresAt: newStory.expiresAt,
            },
          });
          
        } else {
          // For image stories
          if (!req.body.media) {
            return res
              .status(400)
              .json({ error: `Media file is required for ${type} stories` });
          }

          try {
            // The media filename is already provided from the frontend
            const mediaFilename = req.body.media;
            
            // Check if the media URL is from Cloudinary
            if (mediaFilename && mediaFilename.includes('cloudinary')) {
              // Perform AI image moderation for the uploaded image
              // Use the same robust moderation as posts
              try {
                console.log("🔍 Checking image content for story:", mediaFilename);
                const imageAnalysisResult = await analyzeImageContent(mediaFilename);
                
                if (!imageAnalysisResult.isClean) {
                  logContentViolation("story_image", userInfo.id, imageAnalysisResult, { media: mediaFilename });
                  return res.status(400).json({
                    error: "Content not allowed",
                    reason: imageAnalysisResult.violations && imageAnalysisResult.violations.length > 0 
                      ? imageAnalysisResult.violations[0].reason 
                      : "Inappropriate image content detected",
                    message: "Your story image contains inappropriate content that violates our community guidelines.",
                    severity: imageAnalysisResult.severity || "medium"
                  });
                }
                console.log("✅ Image passed content moderation");
              } catch (moderationError) {
                console.error("Image moderation error:", moderationError);
                // Continue with story creation even if moderation fails
                // This is a fallback to prevent blocking legitimate content if the AI service is down
              }
            }
            
            // Create new story object
            const storyData = {
              type,
              userId: userInfo.id,
              media: mediaFilename, // Use the media URL from the frontend
              views: [],
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            };

            // Create story in MongoDB
            const newStory = await Story.create(storyData);
            console.log("✅ Story created with media:", newStory);

            return res.status(200).json({
              message: "Story has been created",
              story: {
                id: newStory._id,
                type: newStory.type,
                media: newStory.media,
                createdAt: newStory.createdAt,
                expiresAt: newStory.expiresAt,
              },
            });
          } catch (error) {
            console.error("Story creation error:", error);
            return res.status(500).json({
              error: "Failed to create story",
              message: error.message,
            });
          }
        }

        return res.status(200).json({
          message: "Story has been created",
          story: {
            id: newStory._id,
            type: newStory.type,
            text: newStory.text,
            backgroundColor: newStory.backgroundColor,
            createdAt: newStory.createdAt,
            expiresAt: newStory.expiresAt,
          },
        });
      } catch (err) {
        console.error("Add story error:", err);
        return res.status(500).json({
          error: "Failed to create story",
          message: err.message,
        });
      }
    }
  );
};

export const viewStory = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
          return res.status(400).json("Invalid user ID");
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json("Invalid story ID");
        }

        // Find the story
        const story = await Story.findById(req.params.id);

        if (!story) {
          return res.status(404).json("Story not found");
        }

        // Check if story is expired
        if (new Date(story.expiresAt) <= new Date()) {
          return res.status(404).json("Story has expired");
        }

        // Check if user can view this story (must be following the story owner or own story)
        if (story.userId.toString() !== userInfo.id) {
          const isFollowing = await Relationship.findOne({
            followerUserId: userInfo.id,
            followedUserId: story.userId,
          });

          if (!isFollowing) {
            return res
              .status(403)
              .json("You can only view stories from users you follow");
          }
        }

        // Add view if not already viewed
        const hasViewed = story.views.some(
          (view) => view.userId === userInfo.id
        );
        if (!hasViewed) {
          story.views.push({
            userId: userInfo.id,
            viewedAt: new Date(),
          });
          await story.save();
        }

        return res.status(200).json("Story viewed");
      } catch (err) {
        console.error("View story error:", err);
        return res.status(500).json(err);
      }
    }
  );
};

export const deleteStory = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        console.log("Delete story - userInfo:", userInfo);
        console.log("Delete story - storyId:", req.params.id);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
          return res.status(400).json("Invalid user ID");
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json("Invalid story ID");
        }

        // First find the story to get media URL if it exists
        const story = await Story.findOne({
          _id: req.params.id,
          userId: userInfo.id,
        });

        if (!story) {
          return res
            .status(404)
            .json("Story not found or you don't have permission to delete it");
        }

        // If story has media, delete from Cloudinary
        if (story.type === "image" && story.media && story.media.includes('cloudinary')) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = story.media.split('/');
            const filenameWithExt = urlParts[urlParts.length - 1];
            const filename = filenameWithExt.split('.')[0];
            const folderPath = urlParts[urlParts.length - 2];
            const publicId = `${folderPath}/${filename}`;
            
            console.log("🗑️ Attempting to delete media from Cloudinary:", publicId);
            await deleteFromCloudinary(publicId);
            console.log("✅ Media deleted from Cloudinary");
          } catch (cloudinaryError) {
            console.error("Error deleting media from Cloudinary:", cloudinaryError);
            // Continue with story deletion even if Cloudinary deletion fails
          }
        }

        // Delete the story from database
        await Story.deleteOne({ _id: req.params.id });

        console.log("✅ Story deleted successfully:", story._id);
        return res.status(200).json("Story has been deleted.");
      } catch (err) {
        console.error("Delete story error:", err);
        return res.status(500).json({ error: "Failed to delete story", message: err.message });
      }
    }
  );
};

export const getStoryViews = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
          return res.status(400).json("Invalid user ID");
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json("Invalid story ID");
        }

        // Find the story (only if it belongs to the user)
        const story = await Story.findOne({
          _id: req.params.id,
          userId: userInfo.id,
        });

        if (!story) {
          return res
            .status(404)
            .json(
              "Story not found or you don't have permission to view its analytics"
            );
        }

        // Get user details for views
        const userIds = story.views.map((view) => view.userId);
        const users = await User.find(
          { _id: { $in: userIds } },
          "name profilePic username"
        );

        const viewsWithUserDetails = story.views.map((view) => {
          const user = users.find((u) => u._id.toString() === view.userId);
          return {
            userId: view.userId,
            viewedAt: view.viewedAt,
            name: user ? user.name : "Unknown User",
            profilePic: user ? user.profilePic : null,
          };
        });

        return res.status(200).json({
          storyId: story._id,
          totalViews: story.views.length,
          views: viewsWithUserDetails,
        });
      } catch (err) {
        console.error("Get story views error:", err);
        return res.status(500).json(err);
      }
    }
  );
};
