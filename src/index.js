// require('dotenv').config({path : './env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({path : './.env'})


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is listening at port: ${process.env.PORT || 8000}`);
        })
    })
    .catch((error) => {
        console.log('DATABASE CONNECTION ERROR : ', error)
    })

/*
import express from 'express'

const app = express()

(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR : ", error)
            throw error
        })


        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port no :  ${process.env.PORT}`);
        })
    }
    catch(error){
        console.log("ERROR : ", error)
        throw error
    }
})()

*/