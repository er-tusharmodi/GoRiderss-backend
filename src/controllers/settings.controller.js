import Settings from "../models/settings.model.js";
import mongoose from "mongoose";

// defaults aligned to your front-end
const DEFAULTS = {
  isEmailDisplay: true,
  isMobileNumberDisplay: false,
  isExpensesDisplay: true,
  notifTripInvites: true,
  notifMentions: true,
  notifTripReminders: true,
  chatMedia: "Auto",
  readReceipts: "Enabled",
  wifiAutoDl: true,
  twoFA: { enabled: false },
  lang: "English (India)",
  region: "India",
  unit: "Kilometers",
};

const ALLOWED = new Set([
  "isEmailDisplay",
  "isMobileNumberDisplay",
  "isExpensesDisplay",
  "notifTripInvites",
  "notifMentions",
  "notifTripReminders",
  "chatMedia",
  "readReceipts",
  "wifiAutoDl",
  "twoFA",          // { enabled, method? } – method optional
  "lang",
  "region",
  "unit",
  // NOTE: blockedUsers handled by their own endpoints (userConnection), skip here
]);

function sanitizePayload(body = {}) {
  const out = {};
  for (const k of Object.keys(body)) {
    if (!ALLOWED.has(k)) continue;
    out[k] = body[k];
  }
  // guard enums
  if (out.chatMedia && !["Auto", "High", "Data Saver"].includes(out.chatMedia)) delete out.chatMedia;
  if (out.readReceipts && !["Enabled", "Disabled"].includes(out.readReceipts)) delete out.readReceipts;
  if (out.unit && !["Kilometers", "Miles"].includes(out.unit)) delete out.unit;
  // booleans normalization
  for (const b of [
    "isEmailDisplay","isMobileNumberDisplay","isExpensesDisplay",
    "notifTripInvites","notifMentions","notifTripReminders","wifiAutoDl"
  ]) {
    if (b in out) out[b] = !!out[b];
  }
  if (out.twoFA && typeof out.twoFA === "object") {
    out.twoFA = { enabled: !!out.twoFA.enabled, method: out.twoFA.method };
  }
  return out;
}

export async function getSettings(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let doc = await Settings.findOne({ user: userId }).lean();
    if (!doc) {
      // return defaults (no auto-create on GET)
      return res.json({ success: true, data: { ...DEFAULTS, blockedUsers: [] } });
    }
    // merge defaults → doc to ensure all keys present
    const merged = { ...DEFAULTS, ...doc, blockedUsers: doc.blockedUsers || [] };
    return res.json({ success: true, data: merged });
  } catch (e) {
    console.error("getSettings error:", e);
    return res.status(500).json({ success: false, message: "Failed to load settings" });
  }
}

export async function putSettings(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const payload = sanitizePayload(req.body);
    const update = { $set: payload, $setOnInsert: { user: userId } };

    const doc = await Settings.findOneAndUpdate(
      { user: userId },
      update,
      { upsert: true, new: true }
    ).lean();

    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error("putSettings error:", e);
    return res.status(500).json({ success: false, message: "Failed to save settings" });
  }
}
