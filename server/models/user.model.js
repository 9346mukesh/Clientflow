import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50
        },

        lastName: {
            type: String,
            trim: true,
            maxlength: 50
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8
        },

        gender:{
            type: String,
            required: true,
            enum: ["MALE", "FEMALE", "OTHER"]
        },

        jobTitle: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        role: {
            type: String,
            required: true,
            enum: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"],
            default: "DEVELOPER"
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;