import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    guidlines: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true, // PUBLIC = true, PRIVATE = false
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
      enum: ["ACTIVE", "INACTIVE", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Groups = mongoose.model("Groups", groupSchema);
