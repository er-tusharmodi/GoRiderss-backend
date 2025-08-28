// backend/src/middlewares/sessionGuard.middleware.js
import Session from "../models/session.model.js";

let lastWriteAt = new Map(); // per session throttle memory

export async function sessionGuard(req, res, next) {
  try {
    const userId = req.user?.id;
    const jti = req.user?.jti;
    if (!userId || !jti) return res.status(401).json({ success: false, message: "Unauthorized" });

    const s = await Session.findOne({ user: userId, jti, revoked: { $ne: true } }).lean();
    if (!s) return res.status(401).json({ success: false, message: "Session revoked" });

    // Throttle lastSeen update to ~60s
    const key = `${userId}:${jti}`;
    const now = Date.now();
    const prev = lastWriteAt.get(key) || 0;
    if (now - prev > 60000) {
      lastWriteAt.set(key, now);
      Session.updateOne({ _id: s._id }, { $set: { lastSeen: new Date() } }).catch(() => {});
    }

    next();
  } catch (e) {
    console.error("sessionGuard error:", e);
    return res.status(500).json({ success: false, message: "Session check failed" });
  }
}
