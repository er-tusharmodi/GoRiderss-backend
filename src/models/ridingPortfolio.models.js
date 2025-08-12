import mongoose from "mongoose";

const ridingPortfolioSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
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
    details: {
      type: String,
      default: "",
    },
    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bikes",
      required: true,
      default: null,
    },
    kilometer:{
      type:Number,
      required:true,
      trim: true
    }
  },
  {
    timestamps: true, // includes createdAt and updatedAt
    versionKey: false,
  }
);

export const RidingPortfolio = mongoose.model("RidingPortfolio", ridingPortfolioSchema);
