import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    // Content type: 'text' or 'image'
    type: {
      type: String,
      enum: ["text", "image"],
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
    // For image stories
    media: {
      type: String,
      maxlength: 200,
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

// Index for automatic cleanup (24 hours = 86400 seconds)
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const Story = mongoose.model("Story", storySchema);

export default Story;
