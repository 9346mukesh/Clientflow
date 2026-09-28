import mongoose from "mongoose"

export const connectDb = async() =>{
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Database Connected Successfully")

    }
    catch(error){
        console.log(`Database Connection Failed ${error}`)
        process.exit(1)
    }
}

export default connectDb;
