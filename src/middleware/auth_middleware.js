import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        // Token from cookies: The first part tries to get the token from the request cookies, 
        // specifically looking for accessToken.
        // Token from Authorization header: If the token is not found in cookies, it looks for it in the Authorization

        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer","")
        
        // check for token
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
        
        // decode access token and check its validity with ACCESS_TOKEN_SECRET
        //If the token is invalid or expired, it will throw an error, which is caught in the catch block.
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        //If no user is found with that ID (maybe the user was deleted), it throws an Invalid access token error.
        if(!user){
            throw new ApiError(401,"Invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})