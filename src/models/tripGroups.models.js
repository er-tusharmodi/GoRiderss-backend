import mongoose from "mongoose";

const tripGroupSchema = new mongoose.Schema(
  {
    tripName: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    guidelines: {
      type: String,
      default: "",
      required: true,
    },
    budget: {
      type: String,
      default: 0
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    onlyAdminMsg: {
      type: Boolean,
      default: false,
    },
    paymentAmount: {
      type: String,
      default: 0,
    },
    profileImage: {
      type: String,
      default: "", // URL or ImageKit URL
    },
    profileImageID: {
      type: String,
      default: "", // URL or ImageKit URL
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED", "CANCELLED"],
      default: "ACTIVE",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto manage
    versionKey: false,
  }
);

export const TripGroups = mongoose.model("TripGroups", tripGroupSchema);
