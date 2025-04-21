// require('dotenv').config({path:"./env"})

import dotenv from "dotenv"
// import express from "express"
import connectDB from "./db/index.js"
// const app = express()

dotenv.config(
    {
        path:"./env"
    }
)

connectDB()















// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.Mongo_DB_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("Error :",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`app is listening on port :${process.env.PORT}`)
//         })

//     }
//     catch(error){
//         console.error(error)

//         throw error

//     }
// })