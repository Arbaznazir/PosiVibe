import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      maxlength: 45,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100, // Increased for longer email addresses
    },
    password: {
      type: String,
      required: true,
      maxlength: 200,
    },
    name: {
      type: String,
      required: true,
      maxlength: 45,
    },
    coverPic: {
      type: String,
      maxlength: 500, // Increased for Cloudinary URLs
      default: null,
    },
    profilePic: {
      type: String,
      maxlength: 500, // Increased for Cloudinary URLs
      default: null,
    },
    city: {
      type: String,
      maxlength: 45,
      default: null,
    },
    website: {
      type: String,
      maxlength: 200, // Increased for full URLs
      default: null,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);

export default User;
