import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts", // FK to posts
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // FK to users
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comments", // self-reference for nested comments
      default: null,
    },
    commentText: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "deleted", "hidden"],
      default: "active",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

export const Comment = mongoose.model("Comments", commentSchema);
