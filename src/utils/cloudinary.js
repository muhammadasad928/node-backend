import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (locaFilePath) =>{
    try {
        if(!locaFilePath) return null

        // uplaod file
        const uploadResponse = await cloudinary.uploader.upload(locaFilePath, {
            resource_type: "auto"
        })
        return uploadResponse
    } catch (error) {
        fs.unlinkSync(locaFilePath) // remove locally saved files from server if upload operation gets failed
    }
}


export {uploadOnCloudinary}