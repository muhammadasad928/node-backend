import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessTokenAndRefereshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken() 
        const refreshToken = user.generateRefereshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Someting went wrong in token creation")
    }
}


const registerUser = asyncHandler(async (req, res, next) =>{

    const {username, email, fullName, avatar, password} = req.body

    if(
        [username, email, fullName, avatar, password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if(existingUser){
        throw new ApiError(409, "email or username is taken")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatarCloudURL = await uploadOnCloudinary(avatarLocalPath)
    const coverImageCloudURL = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatarCloudURL){
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatarCloudURL.url,
        username: username.toLowerCase(),
        email,
        coverImage: coverImageCloudURL?.url || "",
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating new user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res, next) =>{
    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const foundUser = await User.findOne(
        {
            $or: [{email}, {username}]
        }
    )

    if(!foundUser){
        throw new ApiError(404, "No User Found")
    }
    
    const isPasswordValid = await foundUser.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }

    const {accessToken, refreshToken} = await generateAccessTokenAndRefereshToken(foundUser._id)
    const loggedInUser = await User.findById(foundUser._id)
    .select("-password -refreshToken")

    const cookieOptions = {
        httpOnly: true,
        security: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refereshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, refreshToken, accessToken
            }, 
            "User Logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refereshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const cookieOptions = {
        httpOnly: true,
        security: true
    }

    return res.
    status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refereshToken", cookieOptions)
    .json(new ApiResponse(
        200,
        {},
        "User Logged Out Successfully"
    ))
})

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingReferesh = req.cookies.refereshToken || req.body.refereshToken

    if(!incomingReferesh){
        throw new ApiError(401, "Unauthorized")
    }

    try {
        const decodedToken = jwt.verify(
            incomingReferesh, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid referesh token")
        }
    
        if(incomingReferesh !== user.refreshToken){
            throw new ApiError(401, "Refresh Token is invalid or expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refereshToken} = await generateAccessTokenAndRefereshToken(user._id)
        
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refereshToken", refereshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refereshToken},
                "Access Token refereshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid referesh token")
    }

})

export {registerUser, loginUser, logoutUser, refreshAccessToken}