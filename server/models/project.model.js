import mongoose from "mongoose"

const projectSchema = new mongoose.Schema(
    {
        projectName:{
            type: String,
            required: true,
            unique: true,
        },
        createdBy:{
            type: String,
            required: true,
            enum: ["ADMIN", "PROJECT_MANAGER"],
        },
        assignedTo:{
            type: String,
            required: true,
        },
}, {
        timestamps: true
    }
)

const Project = mongoose.model("Project", projectSchema)

export default Project