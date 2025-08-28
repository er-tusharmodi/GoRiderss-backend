import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatType: {
      type: String,
      enum: ["ONE_TO_ONE", "GROUP", "TRIP_GROUP"],
      required: true,
    },
    chatId: {
      type: String, // Flexible string to support group/trip IDs or 2-user combination
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    messageType: {
      type: String,
      enum: ["TEXT", "IMAGE", "VIDEO", "FILE"],
      default: "TEXT",
    },
    metaData: {
      type: mongoose.Schema.Types.Mixed, // For flexible JSON (links, replyTo ID, file data etc.)
      default: {},
    },
    status: {
      type: String,
      enum: ["SENT", "DELIVERED", "READ"],
      default: "SENT",
    },
  },
  {
    timestamps: true, // createdAt and updatedAt both
    versionKey: false,
  }
);

export const Message = mongoose.model("Messages", messageSchema);
