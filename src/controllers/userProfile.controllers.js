//Utils
import {sendOtpMail} from "../utils/mailer.js";
import {uploadImage} from '../utils/imageKit.js';
import {compressImage} from '../utils/resizeImage.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {apiResponse} from '../utils/apiResponse.js';
// Models
import {User} from '../models/users.models.js';
import {otpVerification} from "../models/otpVerification.models.js";
import {Bikes} from "../models/bikes.models.js";
import {RidingPortfolio} from "../models/ridingPortfolio.models.js";
// Helpers
import jwt from 'jsonwebtoken';
import otpGenerator from "otp-generator";
import mongoose from "mongoose";

const updateUserProfile = asyncHandler(async (req, res) => {
    const {fullName, emailDisplay, mobileNumberDisplay, dob, sex, bloodGroup, instagramLink, youtubeLink, healthHistory, address, bio} = req.body;
    if(!fullName || !dob || !sex || !healthHistory || !address || !bio){
        throw new apiError(400,"All fields are required");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        fullName,
        emailDisplay,
        mobileNumberDisplay,
        dob,
        sex,
        bloodGroup: bloodGroup || undefined,
        instagramLink: instagramLink || undefined,
        youtubeLink: youtubeLink || undefined,
        healthHistory,
        address,
        bio,
        status: "active"
    },{new:true}).select("-hashedPassword -refreshToken");
    return res.status(200).json(new apiResponse(200, user, "User updated successfully"));
});
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath =  req.file?.path || req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required");
    }
    const finalAvatarPath = await compressImage(avatarLocalPath);
    const uploadedAvatar = await uploadImage(finalAvatarPath, "users",req.user?.avatarFileId);
    const updateUser = await User.findById(req.user?._id);
    updateUser.avatarFileId = uploadedAvatar.fileId;
    updateUser.avatarUrl = uploadedAvatar.url;
    await updateUser.save({validateBeforeSave: false});
    if(!updateUser){
        throw new apiError(401,"Updation Failed");
    }
    if(!uploadedAvatar.success){
        throw new apiError(401,"Internal Error");
    }
    return res.status(200).json(new apiResponse(200, uploadedAvatar, "Avatar updated successfully"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath =  req.file?.path || req.files?.cover?.[0]?.path;
    if (!coverLocalPath) {
        throw new apiError(400, "Cover image is required");
    }
    const finalCoverPath = await compressImage(coverLocalPath);
    const uploadedCover = await uploadImage(finalCoverPath, "users",req.user?.coverFileId);
    const updateUser = await User.findById(req.user?._id);
    updateUser.coverFileId = uploadedCover.fileId;
    updateUser.coverImageUrl = uploadedCover.url;
    await updateUser.save({validateBeforeSave: false});
    if(!updateUser){
        throw new apiError(401,"Updation Failed");
    }
    if(!uploadedCover.success){
        throw new apiError(401,"Internal Error");
    }
    return res.status(200).json(new apiResponse(200, uploadedCover, "Cover updated successfully"));
});
const getSingleUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-hashedPassword -refreshToken -coverFileId -avatarFileId");
    return res.status(200).json(new apiResponse(200, user, "User fetch successfully"));
});
const changeUserEmail = asyncHandler(async (req, res) => {
    const {email,otp} = req.body;
    if(!otp){
        if(!email){
            throw new apiError(401,"Email is required");
        }
        if(email === req.user.email){
            throw new apiError(401,"Email already registered. Please use a different email.");
        }
        const emailOtp = otpGenerator.generate(6, {
            digits: true,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        try{
            await otpVerification.create({ target:email, otp:emailOtp, expiresAt:expiresAt, type:"email" });
            await sendOtpMail(email, emailOtp);
            return res.status(201).json({
                success: true,
                message: 'OTP Sent successfully'
            });
        } catch (error) {
            throw new apiError(500, 'Internal server error');
        }
    }else{
        if (!email || !otp) {
            throw new apiError(400, 'Email and OTP are required');
        }
        const otpRecord = await otpVerification.findOne({ target:email, otp:otp, verified: false, type:'email' });
        if (!otpRecord) {
            throw new apiError(400, 'Invalid or expired OTP');
        }
        if (otpRecord.expiresAt < new Date()) {
            throw new apiError(400, 'OTP has expired');
        }
        await otpVerification.deleteMany({ target:email });
        const userUpdate = await User.findById(req.user._id);
        userUpdate.email = email;
        userUpdate.save({validateBeforeSave:false});
        if(!userUpdate){
            throw new apiError(400, 'Something went wrong');
        }
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });
    }
});
const addBikes = asyncHandler(async (req, res) => {
    const {bikeName, bikeDetails} = req.body;
    if(!bikeName){
        throw new apiError(401,"Bike name is required");
    }
    const createBike = await Bikes.create({
        userID: req.user._id,
        bikeName,
        bikeDetails
    });
    const createdBike = await Bikes.findById(createBike._id);
    if(!createdBike){
        throw new apiError(401,"Something went wrong");
    }
    return res.status(200).json(new apiResponse(200,{bikeDetails:createdBike},'Bike added on your profile'));
});
const bikesList = asyncHandler(async (req, res) => {
    const bikesList = await Bikes.find({userID: req.user._id});
    return res.status(200).json(new apiResponse(200,{bikesList:bikesList},"Bikes list fetch successfully"));
});
const deleteBike = asyncHandler(async (req, res) => {
    const {bikeId} = req.params;
    const deletedBike = await Bikes.findById(bikeId);
    if(!deletedBike){
        throw new apiError(401,"Invalid bike ID");
    }
    await Bikes.findByIdAndDelete(bikeId);
    return res.status(200).json(new apiResponse(200,"Deleted successfully"));
});
const createRidingDetail = asyncHandler(async (req, res) => {
    const {fromDate, toDate, source, destination, details, bike, kilometer} = req.body;
    if(!fromDate || !toDate || !source || !destination || !bike){
        throw new apiError(401,"All fields are required");
    }
    const createRidingPortfolio = await RidingPortfolio.create({
        userID: req.user?._id,
        fromDate,
        toDate,
        source,
        destination,
        details,
        bike,
        kilometer
    });
    const createdData = await RidingPortfolio.findById(createRidingPortfolio._id);
    if(!createdData){
        throw new apiError(401,"Internal error");
    }
    return res.status(200).json(new apiResponse(200,{ridingDetails:createdData},"Created successfully"));
})
const ridingPortfolioList = asyncHandler(async (req, res) => {
    const dataList = await RidingPortfolio.find({userID: req.user._id});
    return res.status(200).json(new apiResponse(200,{ridingPortfolioList:dataList},"Riding portfolio list fetch successfully"));
});
const deleteRidingPortfolio = asyncHandler(async (req, res) => {
    const {ridingID} = req.params;
    const deletedRidingPortfolio = await RidingPortfolio.findById(ridingID);
    if(!deletedRidingPortfolio){
        throw new apiError(401,"Invalid riding ID");
    }
    await RidingPortfolio.findByIdAndDelete(deletedRidingPortfolio);
    return res.status(200).json(new apiResponse(200,"Deleted successfully"));
});
const editRidingPortfolio = asyncHandler(async (req, res) => {
    const {ridingID} = req.params;
    const deletedRidingPortfolio = await RidingPortfolio.findById(ridingID);
    if(!deletedRidingPortfolio){
        throw new apiError(401,"Invalid riding ID");
    }
    const {fromDate, toDate, source, destination, details, bike, kilometer} = req.body;
    if(!fromDate || !toDate || !source || !destination || !bike){
        throw new apiError(401,"All fields are required");
    }
    const ridingPortfolioDetails = await RidingPortfolio.findByIdAndUpdate(ridingID,{
        fromDate,
        toDate,
        source,
        destination,
        details,
        bike,
        kilometer
    });
    if(!ridingPortfolioDetails){
        throw new apiError(401,"Internal Error");
    }
    return res.status(200).json(new apiResponse(200,{RidingPortfolio:ridingPortfolioDetails},'Updated successfully'));
});
const getUserProfile = asyncHandler(async (req, res) => {
    const {userID} = req.params;
    if(!userID){
        throw new apiError(401,"Invalid userID");
    }
    const user = await User.findById(userID);
    if(!user){
        throw new apiError(400,"User not found");
    }
    const result = await User.aggregate([
        {
        $match: { _id: new mongoose.Types.ObjectId(userID) }
        },
        {
        $lookup: {
            from: "ridingportfolios",
            localField: "_id",
            foreignField: "userID",
            as: "ridingPortfolio"
        }
        },
        {
        $unwind: {
            path: "$ridingPortfolio",
            preserveNullAndEmptyArrays: true
        }
        },
        {
        $lookup: {
            from: "bikes",
            localField: "ridingPortfolio.bike",
            foreignField: "_id",
            as: "ridingPortfolio.bikeInfo"
        }
        },
        {
        $unwind: {
            path: "$ridingPortfolio.bikeInfo",
            preserveNullAndEmptyArrays: true
        }
        },
        {
        $group: {
            _id: "$_id",
            fullName: { $first: "$fullName" },
            email: { $first: "$email" },
            avatarUrl: { $first: "$avatarUrl" },
            coverImageUrl: { $first: "$coverImageUrl" },
            bio: { $first: "$bio" },
            mobileNumber: { $first: "$mobileNumber" },
            DOB: { $first: "$dob" },
            sex: { $first: "$sex" },
            bloodGroup: { $first: "$bloodGroup" },
            instagramLink: { $first: "$instagramLink" },
            youtubeLink: { $first: "$youtubeLink" },
            healthHistory: { $first: "$healthHistory" },
            ridingPortfolio: {
            $push: {
                fromDate: "$ridingPortfolio.fromDate",
                toDate: "$ridingPortfolio.toDate",
                source: "$ridingPortfolio.source",
                destination: "$ridingPortfolio.destination",
                kilometer: "$ridingPortfolio.kilometer",
                details: "$ridingPortfolio.details",
                bike: {
                _id: "$ridingPortfolio.bikeInfo._id",
                bikeName: "$ridingPortfolio.bikeInfo.bikeName"
                }
            }
            }
        }
        }
    ]);
    return res.status(200).json(new apiResponse(200,result[0],"User profile fetched successfully"));
})
export { 
    updateUserProfile, 
    updateAvatar, 
    updateCoverImage, 
    getSingleUserDetails, 
    changeUserEmail,
    addBikes,
    bikesList,
    deleteBike,
    createRidingDetail,
    ridingPortfolioList,
    deleteRidingPortfolio,
    editRidingPortfolio,
    getUserProfile
};