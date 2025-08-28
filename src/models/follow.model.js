import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    followeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    status: {
      type: String,
      trim: true, 
      enum: ["FOLLOWING", "REQUESTED", "BLOCKED"], 
      default: "FOLLOWING"
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
    versionKey: false,
  }
);
followSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });
export const Follow = mongoose.model("Follow", followSchema);
