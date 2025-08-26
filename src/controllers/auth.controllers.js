// Utils
import {sendOtpMail} from "../utils/mailer.js";
import {apiResponse} from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
// Models
import {User} from '../models/users.models.js';
import {otpVerification} from "../models/otpVerification.models.js";
// Helpers
import jwt from 'jsonwebtoken';
import otpGenerator from "otp-generator";
import ms from "ms";

const generateAccessAndRefreshTokens = async (userId) =>{
    try{
        const user = await User.findById(userId).select("-hashedPassword -refreshToken");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    }catch(error){
        throw new apiError(500, "Token generation failed");
    }
}
const registerUser = asyncHandler(async (req, res) => {
    const {email, fullName, mobileNumber, hashedPassword, userName} = req.body;
    if([email, fullName, mobileNumber, hashedPassword, userName].some(field => !field)) {
        throw new apiError(400, 'All fields are required');
    }
    const existingUser = await User.findOne({
        $or: [{ mobileNumber }, { email }]
    });
    if (existingUser) {
        throw new apiError(400, 'Email or mobile already exists');
    }
    const existingUsername = await User.findOne({
        $or: [{userName }]
    });
    if (existingUsername) {
        throw new apiError(400, 'username already exists');
    }
    const emailOtp = otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });
    const mobileOtp = otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    try{
        const user = await User.create({
            email,
            fullName,
            userName,
            mobileNumber,
            hashedPassword
        });
        const createdUser = await User.findById(user._id).select('-hashedPassword  -refreshToken');
        if(!createdUser) {
            throw new apiError(404, 'User not found');
        }
        await otpVerification.create({ target:email, otp:emailOtp, expiresAt:expiresAt, type:"email" });
        await sendOtpMail(email, emailOtp);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.log('Error registering user:', error);
        throw new apiError(500, 'Internal server error');
    }
});
const verifyOtp = asyncHandler(async (req, res) => {
    const { target, type, otp } = req.body;
    if (!target || !type || !otp) {
        throw new apiError(400, 'Email and OTP are required');
    }
    const otpRecord = await otpVerification.findOne({ target:target, otp:otp, verified: false, type:type });
    if (!otpRecord) {
        throw new apiError(400, 'Invalid or expired OTP');
    }
    if (otpRecord.expiresAt < new Date()) {
        throw new apiError(400, 'OTP has expired');
    }
    await otpVerification.deleteMany({ target:target });
    if(type === "EMAIL") {
        const user = await User.findOneAndUpdate({email:target}, {status:"pending"}, {new:true});
        if(!user) {
            throw new apiError(404, 'User not found');
        }
    } else if(type === "MOBILE") {
        const user = await User.findOneAndUpdate({mobileNumber:target}, {status:"pending"}, {new:true});
        if(!user) {
            throw new apiError(404, 'User not found');
        }
    } else {
        throw new apiError(400, 'Invalid verification type');
    }
    return res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
    });
});
const resendOtp = asyncHandler(async (req, res) => {
    const {target,type} = req.body;
    if(!target || !type){
         return res.status(400).json({ success: false, message: "Email is required" });
    }
    await otpVerification.deleteMany({ target });
    const otp = otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await otpVerification.create({ target, otp, expiresAt, type});
    await sendOtpMail(target, otp);
    return res.status(200).json({
        success: true,
        message: "OTP resent successfully",
    });
});
const loginUser = asyncHandler(async (req, res) => {
    const {email, userName, password} = req.body;
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if(!email && !userName){
        throw new apiError(400, "Email or mobile number is required");
    }
    if(!password){
        throw new apiError(400, "Password is required");
    }
    const user = await User.findOne({
        $or: [{email},{userName}]
    });
    if(!user){
        throw new apiError(404, "Wrong username or password");
    }
    if (user.status === "inActive") {
        throw new apiError(403, "Your account is not active");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new apiError (401,"Invalid password")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("fullName userName email emailDisplay mobileNumber mobileNumberDisplay healthHistory address bio avatarUrl coverImageUrl bloodGroup dob sex");
    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    user.lastIP = userIP;
    await user.save({validateBeforeSave: false});
    return res
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",refreshToken,option)
        .json(new apiResponse(200,{user:loggedInUser,accessToken,refreshToken},`Login successfully`));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new apiError(401,"Refresh token is required");
    }
    try{
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new apiError("401","Invalid refresh token");
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401, "Invalid refresh token");
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(new apiResponse(200,{accessToken, newRefreshToken},"Access token refreshed successfully"));
    }catch(error){
        throw new apiError(401, `Failed to refresh access token: ${error.message}`);
    }
});
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,{
        $set: {refreshToken: undefined}
    },{new: true});
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    return res  
        .status(200)
        .clearCookie("accessToken", "", options)
        .clearCookie("refreshToken", "", options)
        .json(new apiResponse(200, null, "User logged out successfully"));
});
export { 
    registerUser, 
    verifyOtp, 
    resendOtp, 
    loginUser, 
    refreshAccessToken, 
    logoutUser,
};