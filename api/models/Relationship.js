import mongoose from "mongoose";

const relationshipSchema = new mongoose.Schema(
  {
    followerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure each user can only follow another user once
relationshipSchema.index(
  { followerUserId: 1, followedUserId: 1 },
  { unique: true }
);

const Relationship = mongoose.model("Relationship", relationshipSchema);

export default Relationship;
