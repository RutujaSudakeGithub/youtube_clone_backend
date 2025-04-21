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
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port :${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MONGO db connection failed ",error);
})















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