import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { app } from "../app.js";
import { error } from "console";
import { channel } from "process";
import { channel, subscribe } from "diagnostics_channel";


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
    .json(new apiResponse(200,{},"User logged out"))
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
    
            const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
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

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confPassword} =req.body

    if(newPassword!==confPassword){
        throw new apiResponse(400,"New password and confrimed password does not match")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new apiResponse(200,{},"password change successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetail = asyncHandler(async(res,req)=>{
    const {fullname,email} =req.body

    if(!fullname ||!email){
        throw new ApiError(400,"All fields are requried")
    }

   const user = await User.findByIdAndUpdate( 
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar= asyncHandler(async(res,req)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate( 
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage =asyncHandler(async(req,res)=>{
    const localCoverImagePath = req.file?.path

    if(!localCoverImagePath){
        throw new ApiError(400,"Cover Image file is missing")
    }

    const coverimage =uploadCloudinary(localCoverImagePath)

    if(!coverimage){
        throw new ApiError(400,"Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverimage : coverimage.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json( new apiResponse(200,user,"Coverimage uploaded successfully"))
})

const getUserChannelProfile = asyncHandler(async (req,res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }

    const channel =await  User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as :"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount :{
                    $size :"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size :"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                email:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverimage:1

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exists")
    }

    return res
    .status(200)
    .json(new apiResponse(200,channel[0]),"User channel feteched successfully")
    
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate(
        [
            {
                $match:{
                    _id: mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",

                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullname:1,
                                            username:1,
                                            avatar
                                        }
                                    }
                                ]

                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"owner"
                                }
                            }
                        }

                    ]
                }
            }
        ]
    )
    return res
    .status(200)
    .json(new apiResponse(200,user[0].watchHistory),
        "Watch History feteched successfully")

})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}   
