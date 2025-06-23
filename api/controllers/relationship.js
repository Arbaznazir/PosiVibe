import jwt from "jsonwebtoken";
import { createFollowNotification } from "../models/Notification.js";
import Relationship from "../models/Relationship.js";
import mongoose from "mongoose";

// All data is now stored in MongoDB Atlas

// Helper function to get followed users
export const getFollowedUsers = async (userId) => {
  try {
    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn("Invalid userId format in getFollowedUsers:", userId);
      return [];
    }

    const userRelationships = await Relationship.find({
      followerUserId: userId,
    }).lean();
    return userRelationships.map((rel) => rel.followedUserId.toString());
  } catch (error) {
    console.error("Error in getFollowedUsers:", error);
    return [];
  }
};

export const getFollowing = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        const followedUserIds = await getFollowedUsers(userInfo.id);
        return res.status(200).json(followedUserIds);
      } catch (err) {
        console.error("Get following error:", err);
        return res.status(500).json(err);
      }
    }
  );
};

export const getRelationships = async (req, res) => {
  try {
    const followedUserId = req.query.followedUserId;
    const followerUserId = req.query.followerUserId;

    let userRelationships = [];

    if (followedUserId) {
      // Get followers of a user (who follows this user)
      console.log(
        "Getting relationships for user (followers):",
        followedUserId
      );

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(followedUserId)) {
        console.warn("Invalid followedUserId format:", followedUserId);
        return res.status(400).json("Invalid user ID format");
      }

      userRelationships = await Relationship.find({
        followedUserId: followedUserId,
      }).lean();
      console.log("Found relationships (followers):", userRelationships);
      return res
        .status(200)
        .json(
          userRelationships.map((relationship) =>
            relationship.followerUserId.toString()
          )
        );
    } else if (followerUserId) {
      // Get following of a user (who this user follows)
      console.log(
        "Getting relationships for user (following):",
        followerUserId
      );

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(followerUserId)) {
        console.warn("Invalid followerUserId format:", followerUserId);
        return res.status(400).json("Invalid user ID format");
      }

      userRelationships = await Relationship.find({
        followerUserId: followerUserId,
      }).lean();
      console.log("Found relationships (following):", userRelationships);
      return res
        .status(200)
        .json(
          userRelationships.map((relationship) =>
            relationship.followedUserId.toString()
          )
        );
    } else {
      return res
        .status(400)
        .json("Missing query parameter: followedUserId or followerUserId");
    }
  } catch (err) {
    console.error("Get relationships error:", err);
    return res.status(500).json(err);
  }
};

export const addRelationship = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        console.log("Add relationship - userInfo:", userInfo);
        console.log("Add relationship - body:", req.body);

        // Validate ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
          console.warn("Invalid userInfo.id format:", userInfo.id);
          return res.status(400).json("Invalid user session");
        }

        if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
          console.warn("Invalid req.body.userId format:", req.body.userId);
          return res.status(400).json("Invalid target user ID format");
        }

        // Check if relationship already exists
        const existingRelationship = await Relationship.findOne({
          followerUserId: userInfo.id,
          followedUserId: req.body.userId,
        });

        if (existingRelationship) {
          return res.status(409).json("Already following this user.");
        }

        const newRelationship = new Relationship({
          followerUserId: userInfo.id,
          followedUserId: req.body.userId,
        });

        await newRelationship.save();
        console.log("Relationship created:", newRelationship);

        // Create follow notification
        createFollowNotification(userInfo.id, req.body.userId);

        return res.status(200).json("Following");
      } catch (err) {
        console.error("Add relationship error:", err);
        return res.status(500).json(err);
      }
    }
  );
};

export const deleteRelationship = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      try {
        console.log("Delete relationship - userInfo:", userInfo);
        console.log("Delete relationship - userId:", req.query.userId);

        // Validate ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
          console.warn("Invalid userInfo.id format:", userInfo.id);
          return res.status(400).json("Invalid user session");
        }

        if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
          console.warn("Invalid req.query.userId format:", req.query.userId);
          return res.status(400).json("Invalid target user ID format");
        }

        const deletedRelationship = await Relationship.findOneAndDelete({
          followerUserId: userInfo.id,
          followedUserId: req.query.userId,
        });

        if (deletedRelationship) {
          console.log("Relationship deleted:", deletedRelationship);
        } else {
          console.log("No relationship found to delete");
        }

        return res.status(200).json("Unfollow");
      } catch (err) {
        console.error("Delete relationship error:", err);
        return res.status(500).json(err);
      }
    }
  );
};
