import jwt from "jsonwebtoken";
import { createLikeNotification } from "../models/Notification.js";
import Like from "../models/Like.js";
import Post from "../models/Post.js";

// All data is now stored in MongoDB Atlas

export const getLikes = async (req, res) => {
  try {
    const postId = req.query.postId;
    console.log("Getting likes for postId:", postId);

    // Get likes from database
    const postLikes = await Like.find({ postId }).lean();
    console.log("Found likes:", postLikes);

    return res
      .status(200)
      .json(postLikes.map((like) => like.userId.toString()));
  } catch (err) {
    console.error("Get likes error:", err);
    return res.status(500).json(err);
  }
};

// Debug endpoint to see all likes
export const getAllLikes = async (req, res) => {
  try {
    return res.status(200).json({
      likes: likes,
      count: likes.length,
      postIds: [...new Set(likes.map((like) => like.postId))],
      userIds: [...new Set(likes.map((like) => like.userId))],
    });
  } catch (err) {
    console.error("Get all likes error:", err);
    return res.status(500).json(err);
  }
};

export const addLike = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        console.log("Add like - userInfo:", userInfo);
        console.log("Add like - postId:", req.body.postId);

        const postId = req.body.postId;

        // Check if like already exists
        const existingLike = await Like.findOne({
          userId: userInfo.id,
          postId: postId,
        });

        if (existingLike) {
          return res.status(409).json("Post already liked.");
        }

        const newLike = new Like({
          userId: userInfo.id,
          postId: postId,
        });

        await newLike.save();
        console.log("Like created:", newLike);

        // Create notification for post owner
        const post = await Post.findById(postId);
        if (post && post.userId.toString() !== userInfo.id) {
          await createLikeNotification(userInfo.id, post.userId, postId);
        }

        return res.status(200).json("Post has been liked.");
      } catch (err) {
        console.error("Add like error:", err);
        return res.status(500).json(err);
      }
    }
  );
};

export const deleteLike = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        console.log("Delete like - userInfo:", userInfo);
        console.log("Delete like - postId:", req.query.postId);

        const postId = req.query.postId;

        const deletedLike = await Like.findOneAndDelete({
          userId: userInfo.id,
          postId: postId,
        });

        if (deletedLike) {
          console.log("Like deleted:", deletedLike);
        } else {
          console.log("No like found to delete");
        }

        return res.status(200).json("Post has been disliked.");
      } catch (err) {
        console.error("Delete like error:", err);
        return res.status(500).json(err);
      }
    }
  );
};
