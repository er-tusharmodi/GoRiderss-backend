import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  target: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  type: { type: String, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const otpVerification =  mongoose.model("otpVerification", otpSchema);
