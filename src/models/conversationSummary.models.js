import mongoose from "mongoose";

const conversationSummarySchema = new mongoose.Schema(
  {
    chatType: {
      type: String,
      enum: ["ONE_TO_ONE", "GROUP", "TRIP_GROUP"],
      required: true,
    },
    chatId: {
      type: String, // GROUP/TRIP_GROUP => groupId, ONE_TO_ONE => user-user ID combo
      required: true,
    },
    lastMessage: {
      type: String,
      required: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Optional: अगर per-user unreadCount track करना है
    unreadCountMap: {
      type: Map,
      of: Number, // Key: userId, Value: unread count
      default: {},
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const ConversationSummary = mongoose.model("ConversationSummary", conversationSummarySchema);
