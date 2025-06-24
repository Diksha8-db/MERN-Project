import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
  //STEP 1: get user details from front-end

  const { username, email, fullname, password } = req.body;
  console.log(username)

  // STEP 2 : validation (not empty)
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // STEP 3 : check if user already exits : username, email
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }

  // STEP 4 : Check if the required files is available(images, avatar)
  const avatarLocalPath = req.files?.avatar[0]?.path

  const coverImageLocalPath = req.files?.coverImage[0]?.path

  // STEP 5 : Upload them to cloudinary, avatar check
  if(!avatarLocalPath && !coverImageLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  // STEP 6 : Create user object - create entry in DB(relational database)
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

  // STEP 7 : Remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // STEP 8 : check if the user is created successfully
  if(!createdUser){
    throw new ApiError(500, " Something went wrong in creating a user")
  }
  
  // STEP 9 : RETURN response if data is available else return msg
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

});

export { registerUser };
