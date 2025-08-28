import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    scheduledateTime: {
      type: Date,
    },
    status: {
      type: Number,
      enum: [0, 1], // 0 = inactive, 1 = active
      default: 1,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
    versionKey: false,
  }
);

export const Post = mongoose.model("Posts", postSchema);
