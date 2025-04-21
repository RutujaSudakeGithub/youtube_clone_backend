import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async()=>{
    console.log(`Mongo connection ${process.env.Mongo_DB_URL}`)
    try{
        const connectionInstance = await mongoose.connect(`${process.env.Mongo_DB_URL}/${DB_NAME}`)
        // console.log(`Mongo connection ${process.env.Mongo_DB_URL}`)
        console.log(`MongoDB is connected !! DB HOST : ${connectionInstance.connection.host}`)

    }
    catch(error){
        console.error("MongoDB has connectiion error : ",error);
        process.exit(1);

    }
}
//async returns promises

export default connectDB