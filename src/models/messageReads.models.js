import mongoose from "mongoose";

const messageReadSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // क्योंकि createdAt/updatedAt की ज़रूरत नहीं
    versionKey: false,
  }
);

export const MessageRead = mongoose.model("MessageReads", messageReadSchema);
