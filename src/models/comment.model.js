import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Vedio } from "./vedio.models";

const commentSchema = new mongoose.Schema(
    {
        content:{
            type : String,
            required : true
        },
        Vedio:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {timestamps:true})

vedioSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment",commentSchema)