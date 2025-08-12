import mongoose from "mongoose";

const groupAndTripMemberSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "groupType",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    groupType: {
      type: String,
      enum: ["GROUP", "TRIP"],
      required: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "MEMBER"],
      default: "MEMBER",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "LEFT", "REMOVED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const GroupAndTripMember = mongoose.model("GroupAndTripMember", groupAndTripMemberSchema);
