import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()


// ✅ Body parser middleware — must come BEFORE your routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); 









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


//import routes
import userRouter from "./routes/user.routes.js"

//routes declaration 
app.use("/api/v1/users",userRouter)

export {app}