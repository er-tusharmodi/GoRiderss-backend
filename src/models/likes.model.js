import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // dynamic reference
    },
    targetType: {
      type: String,
      required: true,
      enum: ["posts", "comments"], // collection names
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // FK to Users
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    versionKey: false,
  }
);

export const Like = mongoose.model("Likes", likeSchema);
