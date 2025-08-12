import {Router} from 'express';
import { 
    registerUser,
    verifyEmailOtp,
    resendOtp,
    loginUser,
    refreshAccessToken,
    logoutUser
} from '../controllers/auth.controllers.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const userRouter = Router();

userRouter.route("/user-register").post(registerUser);
userRouter.route("/verify-email-otp").post(verifyEmailOtp);
userRouter.route("/resend-otp").post(resendOtp);
userRouter.route("/login-user").post(loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
//verify JWT
userRouter.route("/logout-user").post(verifyJWT,logoutUser)

export default userRouter;