import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            requried:true
        },
        description:{
            type:String,
            requried:true
        },
        vedio:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Vedio"
            }
        ],
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        } 

    },
{timestamps:true})

export const Playlist = mongoose.model("Playlist",playlistSchema)