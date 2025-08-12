import mongoose from "mongoose";

const postTagSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PostTag = mongoose.model("PostTag", postTagSchema);
