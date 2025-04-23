import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multter.middleware.js";

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
// router.route("/login").post(login)

export default router