import mongoose from "mongoose"

const clientSchema = new mongoose.Schema(
    {
        clientName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        companyName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            trim: true,
            maxlength: 20,
        },

        // false = hidden from dropdowns, but old projects still resolve
        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
)

const Client = mongoose.model("Client", clientSchema)

export default Client
