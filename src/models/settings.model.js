// ESM
import mongoose, { Schema } from "mongoose";

const TwoFASchema = new Schema({
  enabled: { type: Boolean, default: false },
  method: { type: String, enum: ["app", "sms", "email"], default: undefined },
  secret: { type: String, select: false }, // keep hidden if you add later
}, { _id: false });

const SettingsSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },

  // Privacy
  isEmailDisplay: { type: Boolean, default: true },
  isMobileNumberDisplay: { type: Boolean, default: false },
  isExpensesDisplay: { type: Boolean, default: true },

  // Notifications
  notifTripInvites: { type: Boolean, default: true },
  notifMentions: { type: Boolean, default: true },
  notifTripReminders: { type: Boolean, default: true },

  // Chat
  chatMedia: { type: String, enum: ["Auto", "High", "Data Saver"], default: "Auto" },
  readReceipts: { type: String, enum: ["Enabled", "Disabled"], default: "Enabled" },
  wifiAutoDl: { type: Boolean, default: true },

  // Security
  twoFA: { type: TwoFASchema, default: () => ({ enabled: false }) },

  // Locale
  lang: { type: String, default: "English (India)" },
  region: { type: String, default: "India" },
  unit: { type: String, enum: ["Kilometers", "Miles"], default: "Kilometers" },

  // Blocked list (store IDs; UI can denormalize)
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
}, {
  timestamps: true,
  collection: "settings",
});

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
