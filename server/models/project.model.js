import mongoose from "mongoose"

const projectSchema = new mongoose.Schema(
    {
        projectTitle: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        projectDescription: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
        },

        // who created the record (Admin or PM), for audit
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // the PM who owns and manages the project; PM queries filter on this
        projectManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: [
                "REQUIREMENT_ANALYSIS",
                "DESIGN",
                "DEVELOPMENT",
                "TESTING",
                "DEPLOYMENT",
                "DELIVERED",
            ],
            default: "REQUIREMENT_ANALYSIS",
        },

        // last used task number; incremented atomically when a task is created
        taskCounter: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
)

// PM project list, newest first
projectSchema.index({ projectManager: 1, createdAt: -1 })
// projects of a client
projectSchema.index({ client: 1 })
// same title allowed for different clients, not twice for one client
projectSchema.index({ client: 1, projectTitle: 1 }, { unique: true })

const Project = mongoose.model("Project", projectSchema)

export default Project
