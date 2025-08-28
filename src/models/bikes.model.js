import mongoose from "mongoose";

const bikeSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // referencing 'Users' collection (capitalized)
      required: true,
    },
    bikeName: {
      type: String,
      required: true,
      trim: true,
    },
    bikeDetails: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

export const Bikes = mongoose.model("Bikes", bikeSchema);
