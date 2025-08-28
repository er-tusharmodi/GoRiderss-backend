import { Router } from "express";
import { getSettings, putSettings } from "../controllers/settings.controller.js";
// ensure your auth middleware populates req.user.id
import { verifyJWT } from "../middlewares/auth.middleware.js"; // must set req.user

const router = Router();

router.get("/", verifyJWT, getSettings);
router.put("/", verifyJWT, putSettings);


export default router;
