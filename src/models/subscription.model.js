import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new mongoose.Schema({
    subscriber : {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    channel : {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)