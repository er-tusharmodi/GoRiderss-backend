import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async () =>{
    try{
        const DBConnection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected: ${DBConnection.connection.host}`);
    }catch(err){
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
};
export default connectDB;