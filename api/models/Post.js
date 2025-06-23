import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
      maxlength: 200,
      default: null,
    },
    img: {
      type: String,
      maxlength: 200,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
