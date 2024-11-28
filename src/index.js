import 'dotenv/config'
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from 'express'
import connectDB from "./db/index.js";
import { app } from './app.js';


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`App is listning at port: ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("DB connection failed !!! ", err)
})