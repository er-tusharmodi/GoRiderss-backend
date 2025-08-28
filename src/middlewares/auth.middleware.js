import jwt from 'jsonwebtoken';
import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {User} from '../models/users.model.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies.accessToken  || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return next(apiError(401, 'You are not authorized to access this resource'));
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
        if (!user) {
            throw new apiError(401, "Invalid access token");
        }
        req.user = user;
        next();
    }catch (error){
        throw new apiError(401, `Failed to verify access token: ${error.message}`);
    }
});