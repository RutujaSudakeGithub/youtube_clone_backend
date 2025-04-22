import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message : "Rutuja Sudake a backend developer"
    })
})

export {registerUser}