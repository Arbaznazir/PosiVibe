import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    // Content type: 'text', 'image', or 'video'
    type: {
      type: String,
      enum: ["text", "image", "video"],
      required: true,
    },
    // For text stories
    text: {
      type: String,
      maxlength: 500,
    },
    // Background color for text stories
    backgroundColor: {
      type: String,
      default: "#6366f1", // Default purple
    },
    // For image/video stories
    media: {
      type: String,
      maxlength: 200,
    },
    // Video duration in seconds (max 30)
    videoDuration: {
      type: Number,
      max: 30,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Stories expire after 24 hours
    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds
    },
    // View tracking
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("Story", storySchema);

export default Story;
