// require('dotenv').config({path:"./env"})

import dotenv from "dotenv"
// import express from "express"
import connectDB from "./db/index.js"
import {app} from "./app.js"
// const app = express()

dotenv.config(
    {
        path:"./env"
    }
)
// connectDB is async function which return promises
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{  //to connect with the port 
        console.log(`Server is running at port :${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MONGO db connection failed ",error);
})




// We are going to run code by using index.js 
// dotenv is added in this code ,beacuse every file should use dotenv data
// connectDB() is a function written in ./db/index.js
// which async function used to connect with mongodb database
// connectDB() return promises if promis is resolved we are connecting to the port
//else rejected then showing rejection message










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