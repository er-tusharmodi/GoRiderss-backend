import {Router} from 'express';
import { 
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    refreshAccessToken,
    logoutUser
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const userRouter = Router();

userRouter.route("/user-register").post(registerUser);
userRouter.route("/verify-otp").post(verifyOtp);
userRouter.route("/resend-otp").post(resendOtp);
userRouter.route("/login-user").post(loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
//verify JWT
userRouter.route("/logout-user").post(verifyJWT,logoutUser)

export default userRouter;