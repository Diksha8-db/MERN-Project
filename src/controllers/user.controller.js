import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async(userId) => {
  try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return {accessToken, refreshToken}
  }
  catch(err){
    throw new ApiError(500, "Something went wrong while generating reefresh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  //STEP 1: get user details from front-end

  const { username, email, fullname, password } = req.body;
  // STEP 2 : validation (not empty)
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // STEP 3 : check if user already exits : username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }
   
  // // STEP 4 : Check if the required files is available(images, avatar)
  const avatarLocalPath = req.files?.avatar[0]?.path

  // const coverImageLocalPath = req.files?.coverImage[0]?.path
  
  let coverImageLocalPath;
  
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path;
  }
  // STEP 5 : Upload them to cloudinary, avatar check
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)


  // // STEP 6 : Create user object - create entry in DB(relational database)
  if(!avatar){
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
    fullname, 
    avatar : avatar.url,
    coverImage : coverImage?.url || "", 
    email,
    username :username.toLowerCase(),
    password
  })


  // // STEP 7 : Remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )


  // // STEP 8 : check if the user is created successfully
  if(!createdUser){
    throw new ApiError(500, " Something went wrong in creating a user")
  }

  
  // // STEP 9 : RETURN response if data is available else return msg
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully!!")
  )

});


// get user details from frontend(username based or email based)
// password check
// if matches then generate the access token and refresh token
// check if the login credentials match with any existing user
// send cookies
// else display the user is not found

const loginUser = asyncHandler(async(req, res) => {
   
  const {email, password, username} = req.body

  console.log(email)
  console.log(password)

  if(!username && !email){
    throw new ApiError(400, "Username or email is required")
  }

  const userFound = await User.findOne({
    $or : [{username},{email}]
  })

  if(!userFound){
    throw new ApiError(404, "User doesnot exist");
  }

  const isPasswordValid = await userFound.isPasswordCorrect(password, userFound.password)


  if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credentials")
  }

  // access and refresh token 
  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(userFound._id)
 
  // cookies 
  const loggedInUser = await User.findById(userFound._id).select("-password -refreshToken")
  
  const options = {
    httpOnly : true,
    secure : true
  }


  return res.status(200)
  .cookie("accessToken",accessToken, options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,accessToken,refreshToken
      },
    "User logged in successfully")
  )

});

const logoutUser = asyncHandler(async(req,res) => {
  await User.findByIdAndUpdate(req.user._id,
    {
      $set : {
        refreshToken: undefined
      }
    },
    {
      new : true
    }
  )

  const options = {
    httpOnly : true,
    secure : true
  }

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged out"))


})

const refreshAccessToken = asyncHandler(async(req,res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  
    if(!incomingRefreshToken){
      throw new ApiError(401, "unauthorized request")
    }
  
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or used")
    }
  
    const options = {
      httpOnly:true,
      secure:true
    }
  
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
    return res
    .status(200)
    .cookie("accessToken",newaccessToken)
    .cookie("refreshToken",newrefreshToken)
    .json(
      new ApiError(
        200,
        {
          accessToken, refreshToken: newrefreshToken
        },
        " Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken};
