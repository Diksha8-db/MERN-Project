import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

const userSchema = new Schema({

    username : {
        type : String,
        unique : true,
        lowercase : true,
        required : [true, "Username is required"],
        trim : true,
        index : true
    },
    email : {
        type : String,
        unique : true,
        lowercase : true,
        required : [true, "email is required"],
        trim : true,
    },
    fullname : {
        type : String,
        required : [true, "Please enter your full name"],
        trim : true,
        index : true
    },
    avatar : {
        type : String, //cloudinary url
        required : true,
    },
    coverImage : {
        type : String,
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password : {
        type : String,
        required : [true, "Password is required"],
    },
    refreshToken : {
        type : String
    }
}, {timestamp:true})

// to encrypt password before saving data
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User", userSchema)