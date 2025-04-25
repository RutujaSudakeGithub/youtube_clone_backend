import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken,
     changeCurrentPassword, getCurrentUser, updateAccountDetail, 
     updateUserAvatar, updateUserCoverImage, 
     getUserChannelProfile,
     getWatchHistory} from "../controllers/user.controller.js";
     
import { upload } from "../middleware/multter.middleware.js";
import { verifyJWT } from "../middleware/auth_middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name :"coverimage",
            maxCount : 1
        }
    ]),

    registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("refresh_token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetail)
router.route("/Avatar").patch(verifyJWT,upload.single("Avatar"),updateUserAvatar)
router.route("/CoverImage").patch(verifyJWT,upload.single("CoverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)



export default router