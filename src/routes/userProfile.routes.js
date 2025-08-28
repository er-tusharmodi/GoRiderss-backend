import {Router} from 'express';
import { 
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
} from '../controllers/userProfile.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const userRouter = Router();
userRouter.use(verifyJWT);

userRouter.route("/change-user-email").post(verifyJWT,changeUserEmail);
userRouter.route("/update-user-profile").patch(verifyJWT,updateUserProfile);
userRouter.route("/get-single-user-details").get(verifyJWT,getSingleUserDetails);
userRouter.route("/update-avatar").patch(verifyJWT,upload.single('avatar'),updateAvatar);
userRouter.route("/update-cover").patch(verifyJWT,upload.single('cover'),updateCoverImage);
userRouter.route("/add-bike").post(verifyJWT,addBikes);
userRouter.route("/bikes-list").get(verifyJWT,bikesList);
userRouter.route("/delete-bike/:bikeId").delete(verifyJWT,deleteBike);
userRouter.route("/add-riding-portfolio").post(verifyJWT,createRidingDetail);
userRouter.route("/riding-portfolio-list").get(verifyJWT,ridingPortfolioList);
userRouter.route("/delete-riding-portfolio/:ridingID").delete(verifyJWT,deleteRidingPortfolio);
userRouter.route("/edit-riding-portfolio/:ridingID").patch(verifyJWT,editRidingPortfolio);
userRouter.route("/get-user-profile/:userID").get(getUserProfile);
userRouter.route("/search-users").get(verifyJWT,searchUsers);


export default userRouter;