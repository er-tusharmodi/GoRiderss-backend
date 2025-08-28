import { Router } from "express";
import {
  followUser, unfollowUser,
  getFollowers, getFollowing, getFollowCounts, getFollowStatus,
  blockUser, unblockUser, listBlockedUsers
} from "../controllers/follow.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // must set req.user

const followRouter = Router();
followRouter.use(verifyJWT);

followRouter.post("/follows/:userId", followUser);
followRouter.delete("/follows/:userId", unfollowUser);

followRouter.get("/follows/:userId/followers", getFollowers);
followRouter.get("/follows/:userId/following", getFollowing);
followRouter.get("/follows/:userId/counts", getFollowCounts);
followRouter.get("/follows/status/:userId", getFollowStatus);

followRouter.post("/blocks/:userId", blockUser);
followRouter.delete("/blocks/:userId", unblockUser);
followRouter.get("/blocks/list", listBlockedUsers);

export default followRouter;
