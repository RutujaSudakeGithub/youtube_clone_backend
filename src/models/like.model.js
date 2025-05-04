import mongoose from "mongoose";

const likeModel = new mongoose.Schema(
    {
        comment:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        },
        vedio:{
            type:mongoose.Schema.type.ObjectId,
            ref:"Vedio"
        },
        likedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        tweet:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Tweet"
        }

    },
    {timestamps:true}
)

export const Like = mongoose.model("Like",likeModel)