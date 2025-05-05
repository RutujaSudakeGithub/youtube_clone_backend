import {v2 as cloudinary} from "cloudinary" // import v2 version of cloudinary library and named as cloudinary
import fs from "fs"

// These credentials are necessary to authenticate your API requests.
cloudinary.config({ 
    cloud_name: process.env.CLOUDNARY_NAME, 
    api_key: process.env.CLOUDNARY_KEY, 
    api_secret: process.env.CLOUDNARY_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("File has been uploaded successfully",response.url)
        fs.unlinkSync(localFilePath)
        return response.url
    }
    catch(error){
        fs.unlinkSync(localFilePath) 
        // remove locally saved tempory file as upload operation get failed
        return null
    }
}

export {uploadCloudinary}