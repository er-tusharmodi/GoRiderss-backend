//Utils
import {uploadImage,deleteImage} from '../utils/imageKit.js';
import {compressImage} from '../utils/resizeImage.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {apiResponse} from '../utils/apiResponse.js';
// Models
import {User} from '../models/users.models.js';
import {Groups} from '../models/groups.models.js';
import {TripGroups} from '../models/tripGroups.models.js'
import {GroupAndTripMember} from '../models/groupAndTripMembers.models.js';
import {TripCheckpoints} from '../models/tripCheckpoints.models.js';
// Helpers
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const createGroup = asyncHandler(async (req, res) => {
    const {groupName, guidlines, isPublic} = req.body;
    const profileImagePath =  req.file?.path || req.files?.profileImage?.[0]?.path;
    if(!groupName || !guidlines || !isPublic || !profileImagePath){
        throw new apiError(401,"All fields are required");
    }
    const finalPath = await compressImage(profileImagePath);
    const uploadedFile = await uploadImage(finalPath, "TripsAndGroups");
    const groupCreated = await Groups.create({
        groupName,
        guidlines,
        createdBy: req.user?._id,
        isPublic,
        profileImage:uploadedFile.url,
        profileImageID:uploadedFile.fileId
    });
    if(!groupCreated){
        deleteImage(uploadedFile.fileId);
        throw new apiError(401,"Internal Problam");
    }
    const addingUserInGroup = await GroupAndTripMember.create({
        groupId:groupCreated._id,
        userId:req.user?._id,
        groupType:'GROUP',
        role:'ADMIN',
        isFavorite:true
    });
    if(!addingUserInGroup){
        throw new apiError(401,"Somthing went wrong");
    }
    return res.status(200).json(new apiResponse(200,groupCreated,"Group created successfully"));
});
const userGroupsList = asyncHandler(async (req,res) => {
    const groupsList = await GroupAndTripMember.aggregate([
        {
        $match: {
            userId: new mongoose.Types.ObjectId(req.user?._id),
            groupType: "GROUP",
            status: "ACTIVE"
        }
        },
        {
        $lookup: {
            from: "groups",
            localField: "groupId",
            foreignField: "_id",
            as: "group"
        }
        },
        { $unwind: "$group" },
        {
        $project: {
            _id: 0,
            groupId: "$group._id",
            groupName: "$group.groupName",
            profileImage: "$group.profileImage",
            guidlines: "$group.guidlines",
            isPublic: "$group.isPublic",
            myRole: "$role",
            isFavorite: 1,
            joinedAt: "$createdAt"
        }
        }
    ]);
    if(!groupsList){
        throw new apiError(401,"Groups not found");
    }
    return res.status(200).json(new apiResponse(200,groupsList,"Groups list fetched successfully"));
});
const createTrip = asyncHandler(async (req, res) => {
    const {tripName, source, destination, startDate, endDate, remarks, guidelines, budget, isPublic, onlyAdminMsg, checkpoints} = req.body;
    const profileImagePath =  req.file?.path || req.files?.profileImage?.[0]?.path;
    if(!tripName || !source || !destination || !startDate || !endDate || !guidelines || !onlyAdminMsg || !isPublic || !profileImagePath){
        throw new apiError(401,"All fields are required");
    }
    
    const finalPath = await compressImage(profileImagePath);
    const uploadedFile = await uploadImage(finalPath, "TripsAndGroups");
    const TripGroupsCreated = await TripGroups.create({
        tripName,
        source,
        destination,
        startDate,
        endDate,
        remarks,
        guidelines,
        budget,
        isPublic,
        onlyAdminMsg,
        profileImage:uploadedFile.url,
        profileImageID:uploadedFile.fileId,
        createdBy:req.user?._id
    });
    if(!TripGroupsCreated){
        deleteImage(uploadedFile.fileId);
        throw new apiError(401,"Internal Problam");
    }
    const addingUserInTripGroup = await GroupAndTripMember.create({
        groupId:TripGroupsCreated._id,
        userId:req.user?._id,
        groupType:'TRIP',
        role:'ADMIN',
        isFavorite:true
    });
    if(!addingUserInTripGroup){
        throw new apiError(401,"Somthing went wrong");
    }
    const checkpointsArray = JSON.parse(checkpoints || "[]");
    if(checkpointsArray.length > 0){
        const formattedCheckpoints = checkpointsArray.map((checkpoint) => ({
            tripId: TripGroupsCreated._id,
            title: checkpoint.title,
            description: checkpoint.description || "",
            timeToReach: checkpoint.timeToReach,
            km: checkpoint.km || "",
            timeToLeave: checkpoint.timeToLeave || "",
            createdBy: req.user?._id
        }));
        await TripCheckpoints.insertMany(formattedCheckpoints);
    }
    return res.status(200).json(new apiResponse(200,TripGroupsCreated,"Trip created successfully"));
});
const userTripsList = asyncHandler(async (req,res) => {
    const tripGroupsList = await GroupAndTripMember.aggregate([
        {
        $match: {
            userId: new mongoose.Types.ObjectId(req.user?._id),
            groupType: "TRIP",
            status: "ACTIVE"
        }
        },
        {
        $lookup: {
            from: "tripgroups",
            localField: "groupId",
            foreignField: "_id",
            as: "trip"
        }
        },
        { $unwind: "$trip" },
        {
        $project: {
            _id: 0,
            tripID: "$trip._id",
            tripName: "$trip.tripName",
            profileImage: "$trip.profileImage",
            isPublic: "$trip.isPublic",
            isFavorite: 1,
            joinedAt: "$createdAt"
        }
        }
    ]);
    if(!tripGroupsList){
        throw new apiError(401,"Groups not found");
    }
    return res.status(200).json(new apiResponse(200,tripGroupsList,"Trips list fetched successfully"));
});
export {createGroup,userGroupsList,createTrip,userTripsList}