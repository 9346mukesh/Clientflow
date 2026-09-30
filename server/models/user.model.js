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

        // stores the bcrypt hash, never the raw password
        password: {
            type: String,
            required: true,
            select: false
        },

        gender: {
            type: String,
            enum: ["MALE", "FEMALE", "OTHER"]
        },

        jobTitle: {
            type: String,
            trim: true,
            maxlength: 100
        },

        role: {
            type: String,
            required: true,
            enum: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]
        },

        // account enabled or disabled by admin (not "online now")
        isActive: {
            type: Boolean,
            default: true
        },

        // true when admin creates the user with a temporary password
        mustChangePassword: {
            type: Boolean,
            default: false
        },

        // null for the seeded admin, otherwise the admin who created the user
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
);

// never send the password hash in API responses
userSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

const User = mongoose.model("User", userSchema);

export default User;