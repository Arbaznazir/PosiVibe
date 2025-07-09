import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    coverPic: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: "",
    },
    trustHistory: [
      {
        score: Number,
        reason: String,
        violationType: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // Verification system
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationBadge: {
      type: String,
      enum: ["none", "green", "blue", "gold", "owner", "red"],
      default: "none",
    },
    verificationReason: {
      type: String,
      default: "",
    },
    verifiedBy: {
      type: String, // Changed from ObjectId to String to allow "system"
      default: null,
    },
    verificationDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
