import mongoose from "mongoose";

const tripCheckpointSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tripGroups",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    timeToReach: {
      type: Date,
      required: true,
    },
    km: {
      type: String,
      default: "",
    },
    timeToLeave: {
      type: Date,
      default: "",
    },
    createdBy: {
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

export const TripCheckpoints = mongoose.model("TripCheckpoints", tripCheckpointSchema);
