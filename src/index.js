import 'dotenv/config'
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from 'express'
import connectDB from "./db/index.js";


connectDB()