import mongoose from "mongoose";

const tripExpensesSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tripGroups",
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    splitType: {
      type: String,
      enum: ["EQUAL", "CUSTOM"],
      default: "EQUAL",
    },
  },
  {
    timestamps: true, // createdAt and updatedAt auto
    versionKey: false,
  }
);

export const TripExpenses = mongoose.model("TripExpenses", tripExpensesSchema);
