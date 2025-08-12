import mongoose from "mongoose";

const tripExpenseMembersSchema = new mongoose.Schema(
  {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tripExpenses",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    shareAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const TripExpenseMembers = mongoose.model("TripExpenseMembers", tripExpenseMembersSchema);
