import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { app } from "../app.js";
import { error } from "console";
// import { channel } from "process";
import { channel, subscribe } from "diagnostics_channel";

// User logs in → server generates access + refresh tokens.
// Server stores refresh token in user.refreshToken in DB.
// Client stores refresh token in a cookie or secure storage.
// When access token expires, client sends refresh token → 
// server checks DB user.refreshToken → if valid, gives a new access token.

const generateAccessAndRefreshToken = async(userID)=>{
    try{
        //load user documnet from database
        const user = await User.findById(userID)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken();
        
        // updates only the in-memory object
        user.refreshToken=refreshToken

        //skip the validation and store the data as it is into database
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

    //item iterate on array , if any empty string is present then it returns false, else true
    //  in this case for any one empty string it return false and error is shown to user
    if(
        [ username,email,fullname,password].some((item)=>item?.trim()==="")
    ){
        throw new ApiError(400,"All fields are requried")
    }

    // this is mongoDB query to find user in 'User' collection that match 
    // either username or password you pass in
    const findeUserName = await User.findOne({
        $or : [{username},{password}]
    })

    //If found user with username and password 
    //then we are showing following error
    if(findeUserName){
        throw new ApiError(409,"User with this email and username is already exists")
    }

    // This code is trying to extarct file paths from incoming request that contain uploded file
    //middleware multer
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverimage[0]?.path

    // is avatar imahe path is not available then showing error
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is requried")
    }

    //by sending the path of avtar and cover image ,uploading images to cloudinary
    //and its result is stored into avatar and coverimage variable
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverimage = await uploadCloudinary(coverImageLocalPath)


    if(!avatar){
        throw new ApiError(400,"Avatar file is requried")
    }

    // create new document into the database using following  objects
    //User.create - mongoDB method

    const user = await User.create({
        username : username.toLowerCase(),
        fullname,
        password,
        email,
        avatar,
        coverimage
    })

    //findById is searching user id into database ,createduser varible stores complete data of user 
    // instead of password and refreshtoken

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //if user is not found then showing error

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    // e;se showing message of user is created 
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
    // console.log(req.body)

    //destructuring
    //extracting data of username , password,email from req.body
    const{username,password,email} = req.body 
    
    //checking username and password
    if(!username && !email){
        throw new ApiError(400,"username or email is requried")
    }

    // searching fro username and email from User collection
    // storing ouput into user varible
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    // if user is not available then showing error
    if(!user){
        throw new ApiError(404,"User does not exists")
    }

    // calling is passwordCorrect method implemented in users.model
    const isPasswordvalid = await user.isPasswordCorrect(password)
    //check for password
    if(!isPasswordvalid){
        throw new ApiError(401,"Invalid user credentials")
    }

    //calling method generateAccessAndRefreshToken implemneted in users.controller.js
    // which return accessToken and refreshToken
    const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    
    //extracting data of user and storing it into loggedUser
    const loggedUser = await User.findById(user._id).select("-password -refreshToken");


    // cookies are only modify on server
    //used when setting cookies in an HTTP response
    const options={
        httpOnly : true,
        secure : true
    }

    //response send to user 
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

// Finds one document that matches the first argument (the query).
// Updates it using the second argument (the update instructions).
// Returns the updated document (or the original, depending on options).

    User.findOneAndUpdate(
        req.user._id,  //find documnet using user id 
        {
            $unset:{
                refreshToken:1  // delete the refresh token
            }
        },
        {
            new :true // to return updated documnet
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

    // destrcturing data from req.body
    const {oldPassword,newPassword,confPassword} =req.body

    //checking new password is write or wrong 
    if(newPassword!==confPassword){
        throw new apiResponse(400,"New password and confrimed password does not match")
    }

    //finding user using -id and storing it into user variable
    const user = await User.findById(req.user?._id)

    //checking inputed old password is correct or not 
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    // if oldPassword is not correct then showing error
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }
    //if it is correct then assigning newPassword to password feild
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    //returing response
    return res
    .status(200)
    .json(new apiResponse(200,{},"password change successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    //is an Express route handler wrapped in asyncHandler, which helps catch async errors.
    //req.user->set by your authentication middleware 
    //It contains the currently authenticated user’s data
    return res
    .status(200)
    .json(new apiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetail = asyncHandler(async(res,req)=>{
    //destructing data 
    const {fullname,email} =req.body
    
    //check for fullname and email
    if(!fullname ||!email){
        throw new ApiError(400,"All fields are requried")
    }

    //
   const user = await User.findByIdAndUpdate( 
        req.user?._id, //find documnet using user_id
        {
            $set:{
                fullname, //updating fullname and email
                email     
            }
        },
        {
            new : true   //returns updated document
        }
    ).select("-password")  // dont allow password to show

    return res
    .status(200)
    .json(new apiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar= asyncHandler(async(res,req)=>{
    // extracting file path
    const avatarLocalPath = req.file?.path

    //check for file path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    
    //upload on cloudinary and storing response in avatar variable
    const avatar = await uploadCloudinary(avatarLocalPath)

    //check for url generated on cloudinary
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    // updating url
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
    //It extracts the username value directly into a variable you can use in your handler.
    const {username} = req.params

    // check for the username , trim() trims space in username
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
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}   
