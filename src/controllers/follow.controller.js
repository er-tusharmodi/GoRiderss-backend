import mongoose from "mongoose";
import { Follow } from "../models/follow.model.js";
import {User} from '../models/users.model.js';

const { ObjectId } = mongoose.Types;

const oid = (v) => (mongoose.isValidObjectId(v) ? new ObjectId(v) : null);
const getMeId = (req) => req?.user?.id || req?.user?._id || req?.auth?.userId;

const ensureNotSelf = (me, other) => {
  if (me.equals(other)) {
    const err = new Error("Action on self is not allowed");
    err.status = 400;
    throw err;
  }
};

const isBlockedEitherWay = async (a, b) => {
  const doc = await Follow.exists({
    $or: [
      { followerId: a, followeeId: b, status: "BLOCKED" },
      { followerId: b, followeeId: a, status: "BLOCKED" },
    ],
  });
  return !!doc;
};

// POST /follows/:userId
export const followUser = async (req, res, next) => {
  try {
    const meStr = getMeId(req);
    const me = oid(meStr);
    const target = oid(req.params.userId);
    if (!me || !target) return res.status(400).json({ success: false, message: "Invalid user id" });
    ensureNotSelf(me, target);

    if (await isBlockedEitherWay(me, target)) {
      return res.status(403).json({ success: false, message: "Follow not allowed (blocked)" });
    }

    const status = req.query.requested ? "REQUESTED" : "FOLLOWING";

    await Follow.updateOne(
      { followerId: me, followeeId: target },
      { $set: { status } },
      { upsert: true }
    );

    return res.json({ success: true, message: status === "FOLLOWING" ? "Following" : "Request sent" });
  } catch (err) {
    next(err);
  }
};

// DELETE /follows/:userId
export const unfollowUser = async (req, res, next) => {
  try {
    const meStr = getMeId(req);
    const me = oid(meStr);
    const target = oid(req.params.userId);
    if (!me || !target) return res.status(400).json({ success: false, message: "Invalid user id" });
    ensureNotSelf(me, target);

    await Follow.deleteOne({
      followerId: me,
      followeeId: target,
      status: { $in: ["FOLLOWING", "REQUESTED"] },
    });

    return res.json({ success: true, message: "Unfollowed" });
  } catch (err) {
    next(err);
  }
};

// POST /blocks/:userId
export const blockUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const meStr = getMeId(req);
    const me = oid(meStr);
    const target = oid(req.params.userId);
    if (!me || !target) return res.status(400).json({ success: false, message: "Invalid user id" });
    ensureNotSelf(me, target);

    await session.withTransaction(async () => {
      // create/update block (me → target)
      await Follow.updateOne(
        { followerId: me, followeeId: target },
        { $set: { status: "BLOCKED" } },
        { upsert: true, session }
      );

      // cleanup any follows both directions
      await Follow.deleteMany(
        {
          $or: [
            { followerId: me, followeeId: target, status: { $in: ["FOLLOWING", "REQUESTED"] } },
            { followerId: target, followeeId: me, status: { $in: ["FOLLOWING", "REQUESTED"] } },
          ],
        },
        { session }
      );
    });

    return res.json({ success: true, message: "User blocked" });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// DELETE /blocks/:userId
export const unblockUser = async (req, res, next) => {
  try {
    const meStr = getMeId(req);
    const me = oid(meStr);
    const target = oid(req.params.userId);
    if (!me || !target) return res.status(400).json({ success: false, message: "Invalid user id" });
    ensureNotSelf(me, target);

    await Follow.deleteOne({ followerId: me, followeeId: target, status: "BLOCKED" });
    return res.json({ success: true, message: "User unblocked" });
  } catch (err) {
    next(err);
  }
};

// GET /follows/:userId/followers?limit=&cursor=
export const getFollowers = async (req, res, next) => {
  try {
    const userId = oid(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, message: "Invalid user id" });

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const cursor = req.query.cursor ? oid(String(req.query.cursor)) : null;

    const q = { followeeId: userId, status: "FOLLOWING" };
    if (cursor) q._id = { $lt: cursor };

    const rows = await Follow.find(q).sort({ _id: -1 }).limit(limit).lean();
    const nextCursor = rows.length === limit ? rows[rows.length - 1]._id : null;

    res.json({ success: true, data: rows, nextCursor });
  } catch (err) {
    next(err);
  }
};

// GET /follows/:userId/following?limit=&cursor=
export const getFollowing = async (req, res, next) => {
  try {
    const userId = oid(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, message: "Invalid user id" });

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const cursor = req.query.cursor ? oid(String(req.query.cursor)) : null;

    const q = { followerId: userId, status: "FOLLOWING" };
    if (cursor) q._id = { $lt: cursor };

    const rows = await Follow.find(q).sort({ _id: -1 }).limit(limit).lean();
    const nextCursor = rows.length === limit ? rows[rows.length - 1]._id : null;

    res.json({ success: true, data: rows, nextCursor });
  } catch (err) {
    next(err);
  }
};

// GET /follows/:userId/counts
export const getFollowCounts = async (req, res, next) => {
  try {
    const userId = oid(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, message: "Invalid user id" });

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followeeId: userId, status: "FOLLOWING" }),
      Follow.countDocuments({ followerId: userId, status: "FOLLOWING" }),
    ]);

    res.json({ success: true, data: { followersCount, followingCount } });
  } catch (err) {
    next(err);
  }
};

// GET /follows/status/:userId  (me ↔ :userId)
export const getFollowStatus = async (req, res, next) => {
  try {
    const meStr = getMeId(req);
    const me = oid(meStr);
    const other = oid(req.params.userId);
    if (!me || !other) return res.status(400).json({ success: false, message: "Invalid user id" });
    ensureNotSelf(me, other);

    const [meToOther, otherToMe] = await Promise.all([
      Follow.findOne({ followerId: me, followeeId: other }).lean(),
      Follow.findOne({ followerId: other, followeeId: me }).lean(),
    ]);

    const data = {
      following: meToOther?.status === "FOLLOWING",
      requested: meToOther?.status === "REQUESTED",
      followedBy: otherToMe?.status === "FOLLOWING",
      iBlocked: meToOther?.status === "BLOCKED" || false,
      blockedMe: otherToMe?.status === "BLOCKED" || false,
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /blocks/list?limit=&cursor=
// Returns users that the current user has blocked
export const listBlockedUsers = async (req, res, next) => {
  try {
    const meStr = getMeId(req);
    const me = oid(meStr);
    if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });

    // pagination
    const limitNum = parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(100, limitNum) : 50;
    const cursor = req.query.cursor ? oid(String(req.query.cursor)) : null;

    const q = { followerId: me, status: "BLOCKED" };
    if (cursor) q._id = { $lt: cursor };

    // first get block rows (only ids)
    const rows = await Follow.find(q, { followeeId: 1 })
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    const nextCursor = rows.length === limit ? rows[rows.length - 1]._id : null;

    // fetch user docs in one go
    const ids = rows.map(r => r.followeeId).filter(Boolean);
    const users = ids.length
      ? await User.find({ _id: { $in: ids } }, "fullName userName avatarUrl").lean()
      : [];

    const map = new Map(users.map(u => [String(u._id), u]));

    const items = rows.map(r => {
      const u = map.get(String(r.followeeId)) || {};
      return {
        id: String(r.followeeId),
        name: String(u.fullName || ""),
        username: String(u.userName || ""),
        avatarUrl: String(u.avatarUrl || ""),
      };
    });

    return res.json({
      success: true,
      data: { items, nextCursor },
    });
  } catch (err) {
    console.error("listBlockedUsers error:", err);
    return res.status(500).json({ success: false, message: "Failed to load blocked users" });
  }
};
