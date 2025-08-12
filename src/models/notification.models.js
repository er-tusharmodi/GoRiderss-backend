import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // User who will receive the notification
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // User who triggered the notification
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetType", // Dynamic reference
    },
    targetType: {
      type: String,
      enum: ["posts", "comments", "FOLLOW", "MENTION", "SYSTEM"],
      required: true,
    },
    IPAddress: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

export const Notification = mongoose.model("Notifications", notificationSchema);
