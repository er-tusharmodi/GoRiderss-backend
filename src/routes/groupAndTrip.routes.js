import {Router} from 'express';
import { 
    createGroup,
    userGroupsList,
    createTrip,
    userTripsList
} from '../controllers/groupAndTrip.controllers.js';
import {upload} from '../middlewares/multer.middlewares.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const groupAndTripRouter = Router();
groupAndTripRouter.use(verifyJWT);
// Groups routers
groupAndTripRouter.route("/group-create").post(verifyJWT,upload.single('profileImage'),createGroup);
groupAndTripRouter.route("/user-groups-list").get(verifyJWT,userGroupsList);
groupAndTripRouter.route("/trip-create").post(verifyJWT,upload.single('profileImage'),createTrip);
groupAndTripRouter.route("/user-trips-list").get(verifyJWT,userTripsList);
export default groupAndTripRouter;