import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//app.use() -> is basically used for configurations or middlewares
app.use(cors({
    origin : process.env.CORS_ORIGIN, // we can define origin of request 
    credentials:true
}))
//to accpet jsonn data from frontend
app.use(express.json({limit:"16kb"}))

//to accept data from URL
// extended -> to give objects inside the object
app.use(express.urlencoded({extended:true,limit:"16kb"}))

// to store assests like pdf,images in local server
app.use(express.static("public"))

//to access and set cookies of user browser by using server
app.use(cookieParser())

export {app}