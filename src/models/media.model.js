import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Post", "Group", "Trip"], // Match the model names
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      required: true,
      enum: ["IMAGE", "VIDEO"],
    },
    caption: {
      type: String,
      default: "",
    },
    position: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const Media = mongoose.model("Media", mediaSchema);
