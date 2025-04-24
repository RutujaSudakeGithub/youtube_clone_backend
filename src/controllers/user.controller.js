import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { app } from "../app.js";
import { error } from "console";


const generateAccessAndRefreshToken = async(userID)=>{
    try{
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken();
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"Someting went wrong while generation access and refresh token")
    }
}


const registerUser = asyncHandler(async (req,res)=>{
    //get user details from frontend
    //validation - not empty,correct format
    //check user already exists : username,email
    //check for images,check for avatar
    //create user object create entry in DB
    //remove password and refersh token field from response
    //check for user creation
    //return response

    // req.body -> used when data is coming from body and from
    const{username,email,fullname,password}=req.body
    // console.log(`Username :${username}`)

    if(
        [ username,email,fullname,password].some((item)=>item?.trim()==="")
    ){
        throw new ApiError(400,"All fields are requried")
    }

    const findeUserName = await User.findOne({
        $or : [{username},{password}]
    })

    if(findeUserName){
        throw new ApiError(409,"User with this email and username is already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverimage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is requried")
    }

    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverimage = await uploadCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is requried")
    }

    const user = await User.create({
        username : username.toLowerCase(),
        fullname,
        password,
        email,
        avatar,
        coverimage
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse(200,createdUser,"User Registered Successfully")
    )

})

const loginUser = asyncHandler(async(req,res)=>{
    //req body -> data
    //username or email check
    //find the user
    // check the password
    //access and refresh token
    //send cookie

    const {username,password,email} = req.body 
    console.log(username)

    if(!username && !email){
        throw new ApiError(400,"username or email is requried")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exists")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)
    if(!isPasswordvalid){
        throw new ApiError(401,"Invalid user credentials")
    }
    const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    
    const loggedUser = await User.findById(user._id).select("-password -refreshToken");


    // cookies are only modify on server
    const options={
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(
            200,
            {
                user:loggedUser,refreshToken,accessToken
            },
            "User logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async(req,res)=>{
    User.findOneAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new :true
        }
    )
    const options={
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(200,{},"User logged out")
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorised request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401,"Refresh token expired or used")
        }
    
        const options ={
            httpOnly : true,
            secure : true
        }
    
            const {newAccessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
            return res
            .status(200)
            .cookie("accessToken ",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new apiResponse(
                    200,
                    {accessToken,refreshToken:newRefreshToken},
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
 
})
export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}