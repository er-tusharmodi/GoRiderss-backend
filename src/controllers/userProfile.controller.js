//Utils
import {sendOtpMail} from "../utils/mailer.js";
import {uploadImage} from '../utils/imageKit.js';
import {compressImage} from '../utils/resizeImage.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {apiResponse} from '../utils/apiResponse.js';
// Models
import {User} from '../models/users.model.js';
import {otpVerification} from "../models/otpVerification.model.js";
import {Bikes} from "../models/bikes.model.js";
import {RidingPortfolio} from "../models/ridingPortfolio.model.js";
import {Follow} from "../models/follow.model.js";
// Helpers
import jwt from 'jsonwebtoken';
import otpGenerator from "otp-generator";
import mongoose, { Types } from "mongoose";

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
        linkedinLink: youtubeLink || undefined,
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
    const {title,fromDate, toDate, source, destination, details, bike, kilometer} = req.body;
    if(!title || !fromDate || !toDate || !source || !destination || !bike){
        throw new apiError(401,"All fields are required");
    }
    const createRidingPortfolio = await RidingPortfolio.create({
        userID: req.user?._id,
        title,
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
    const {title, fromDate, toDate, source, destination, details, bike, kilometer} = req.body;
    if(!title || !fromDate || !toDate || !source || !destination || !bike){
        throw new apiError(401,"All fields are required");
    }
    const ridingPortfolioDetails = await RidingPortfolio.findByIdAndUpdate(ridingID,{
        title,
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
    const bikesList = await Bikes.find({userID: userID});

    const selfId = new mongoose.Types.ObjectId(userID);

    const result = await User.aggregate([
      { $match: { _id: selfId } },

      // ---- Riding Portfolio + Bike info (array) ----
      {
        $lookup: {
          from: "ridingportfolios",
          let: { selfId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$userID", "$$selfId"] } } },
            {
              $lookup: {
                from: "bikes",
                localField: "bike",
                foreignField: "_id",
                as: "bikeInfo",
              },
            },
            { $unwind: { path: "$bikeInfo", preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                bike: {
                  _id: "$bikeInfo._id",
                  bikeName: "$bikeInfo.bikeName",
                  bikeDetails: "$bikeInfo.bikeDetails",
                },
              },
            },
            { $project: { bikeInfo: 0 } },
          ],
          as: "ridingPortfolio",
        },
      },

      // ---- Followers (who follow me) ----
      {
        $lookup: {
          from: "follows",
          let: { selfId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followeeId", "$$selfId"] },
                    { $eq: ["$status", "FOLLOWING"] },
                  ],
                },
              },
            },
            { $project: { _id: 0, followerId: 1 } },
          ],
          as: "_followers",
        },
      },

      // ---- Following (whom I follow) ----
      {
        $lookup: {
          from: "follows",
          let: { selfId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followerId", "$$selfId"] },
                    { $eq: ["$status", "FOLLOWING"] },
                  ],
                },
              },
            },
            { $project: { _id: 0, followeeId: 1 } },
          ],
          as: "_following",
        },
      },

      // ---- Coerce to arrays safely (guards against strings/null) ----
      {
        $addFields: {
          rpArr: { $cond: [{ $isArray: "$ridingPortfolio" }, "$ridingPortfolio", []] },
          followersArr: { $cond: [{ $isArray: "$_followers" }, "$_followers", []] },
          followingArr: { $cond: [{ $isArray: "$_following" }, "$_following", []] },
        },
      },

      // ---- Derived metrics using guarded arrays ----
      {
        $addFields: {
          // Basic fallbacks (do not coerce arrays/objects here)
          fullName: { $ifNull: ["$fullName", ""] },
          userName: { $ifNull: ["$userName", ""] },
          email: { $ifNull: ["$email", ""] },
          avatarUrl: { $ifNull: ["$avatarUrl", ""] },
          coverImageUrl: { $ifNull: ["$coverImageUrl", ""] },
          bio: { $ifNull: ["$bio", ""] },
          mobileNumber: { $ifNull: ["$mobileNumber", ""] },
          dob: { $ifNull: ["$dob", null] },
          sex: { $ifNull: ["$sex", null] },
          bloodGroup: { $ifNull: ["$bloodGroup", null] },
          instagramLink: { $ifNull: ["$instagramLink", ""] },
          youtubeLink: { $ifNull: ["$youtubeLink", ""] },
          linkedinLink: { $ifNull: ["$linkedinLink", ""] },
          healthHistory: { $ifNull: ["$healthHistory", ""] },
          address: { $ifNull: ["$address", ""] },

          tripsCount: { $size: "$rpArr" },

          totalDistanceKm: {
            $sum: {
              $map: {
                input: "$rpArr",
                as: "rp",
                in: { $ifNull: ["$$rp.kilometer", 0] },
              },
            },
          },

          firstFromDate: {
            $min: {
              $map: {
                input: "$rpArr",
                as: "rp",
                in: {
                  $cond: [
                    { $gt: ["$$rp.fromDate", null] },
                    { $toDate: "$$rp.fromDate" },
                    null,
                  ],
                },
              },
            },
          },

          bikeIds: {
            $map: {
              input: "$rpArr",
              as: "rp",
              in: "$$rp.bike._id",
            },
          },
          bikeObjects: {
            $map: {
              input: "$rpArr",
              as: "rp",
              in: {
                _id: "$$rp.bike._id",
                bikeName: "$$rp.bike.bikeName",
                bikeDetails: "$$rp.bike.bikeDetails",
              },
            },
          },

          followerIds: {
            $map: { input: "$followersArr", as: "f", in: "$$f.followerId" },
          },
          followingIds: {
            $map: { input: "$followingArr", as: "f", in: "$$f.followeeId" },
          },
        },
      },

      {
        $addFields: {
          followersCount: { $size: "$followersArr" },
          followingCount: { $size: "$followingArr" },
          friendsCount: { $size: { $setIntersection: ["$followerIds", "$followingIds"] } },

          totalBikesComputed: {
            $size: { $setDifference: [{ $setUnion: ["$bikeIds", []] }, [null]] },
          },
          bikesUnique: { $setUnion: ["$bikeObjects", []] },

          experienceYears: {
            $cond: [
              { $gt: ["$firstFromDate", null] },
              { $dateDiff: { startDate: "$firstFromDate", endDate: "$$NOW", unit: "year" } },
              0,
            ],
          },
        },
      },

      // ---- Final projection ----
      {
        $project: {
          _id: 1,
          fullName: 1,
          userName: 1,
          email: 1,
          avatarUrl: 1,
          coverImageUrl: 1,
          bio: 1,
          mobileNumber: 1,
          DOB: "$dob",
          sex: 1,
          bloodGroup: 1,
          instagramLink: 1,
          youtubeLink: 1,
          linkedinLink: 1,
          healthHistory: 1,
          address: 1,
          ridingPortfolio: "$rpArr",

          bikesList: {
            list: "$bikesUnique",
            totalBikes: "$totalBikesComputed",
          },

          profileCounts: {
            Trips: "$tripsCount",
            Posts: { $literal: 0 },
            Followers: "$followersCount",
            Following: "$followingCount",
            Friends: "$friendsCount",
            totalDistance: "$totalDistanceKm",
            totalBikes: "$totalBikesComputed",
            totalRides: { $literal: 0 },
            statesCovered: { $literal: 0 },
            experience: "$experienceYears",
          },
        },
      },
    ]);
    return res.status(200).json(new apiResponse(200,result[0],"User profile fetched successfully"));
})
const searchUsers = asyncHandler(async (req, res) => {
    try {
    // viewer (just for self-hide)
    const meIdStr = req.user?.id ? String(req.user.id) : null;

    // ---- safe query parsing ----
    const q = String(req.query.q || "").trim();

    const pageNum = Number.parseInt(String(req.query.page ?? "1"), 10);
    const limitNum = Number.parseInt(String(req.query.limit ?? "24"), 10);
    const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const limitRaw = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 24;
    const limit = Math.min(50, limitRaw);
    const sort = String(req.query.sort || "relevance"); // relevance|newest|topKm|topRides
    const skip = (page - 1) * limit;

    // ---- base match ----
    const match = {};
    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        match.$or = [{ fullName: rx }, { userName: rx }, { address: rx }];
    }

    // ---- sort stage ----
    const sortStage =
        sort === "newest"   ? { $sort: { _id: -1 } } :
        sort === "topKm"    ? { $sort: { totalKm: -1 } } :
        sort === "topRides" ? { $sort: { totalRides: -1 } } :
                            { $sort: { verified: -1, totalKm: -1 } };

    // ---- aggregate (no follow flags) ----
    const pipeline = [
        { $match: match },

        // hide self (string-compare to avoid ObjectId vs string mismatch)
        ...(meIdStr ? [{ $match: { $expr: { $ne: [ { $toString: "$_id" }, meIdStr ] } } }] : []),

        {
        $lookup: {
            from: "ridingportfolios",        // ensure this collection name is correct
            localField: "_id",
            foreignField: "userID",
            as: "rp",
        },
        },
        {
        $project: {
            _id: 1,
            fullName:  { $ifNull: ["$fullName",  ""] },
            userName:  { $ifNull: ["$userName",  ""] },
            avatarUrl: { $ifNull: ["$avatarUrl", ""] },
            address:   { $ifNull: ["$address",   ""] },
            // reliable boolean
            verified:  { $toBool: { $ifNull: ["$isVerified", false] } },
            totalRides: { $size: "$rp" },
            totalKm: {
            $sum: {
                $map: {
                input: "$rp",
                as: "x",
                in: { $toDouble: { $ifNull: ["$$x.kilometer", 0] } }
                }
            }
            },
        },
        },

        sortStage,

        {
        $facet: {
            items: [
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                _id: 0,
                id: "$_id",
                name: "$fullName",
                username: "$userName",
                avatarUrl: 1,
                location: "$address",
                verified: 1,
                totalRides: 1,
                totalKm: 1,
                }
            }
            ],
            meta: [{ $count: "total" }],
        },
        },
    ];

    const [out] = await User.aggregate(pipeline).allowDiskUse(true);
    const items = out?.items || [];
    const total = out?.meta?.[0]?.total || 0;

    return res.status(200).json({
        success: true,
        data: {
        items,
        pagination: { page, limit, total, hasNext: skip + items.length < total },
        },
    });
    } catch (err) {
    console.error("searchUsers error:", err);
    return res.status(500).json({ success: false, message: "Search failed", errors: [] });
    }
});
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
    getUserProfile,
    searchUsers
};