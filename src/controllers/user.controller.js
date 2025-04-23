import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";


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

export {registerUser}