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
    dateTime: {
      type: Date,
      required: true,
    },
    km: {
      type: String,
      default: "",
    },
    timeToReach: {
      type: String,
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

export const TripCheckpoint = mongoose.model("TripCheckpoints", tripCheckpointSchema);
