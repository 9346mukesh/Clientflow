import mongoose from "mongoose";

const taskName = new mongoose.Schema(
    {
        tastTitle:{
            type: String,
            required: true,
        },
        taskDescription:{
            type: String,
            required: true,

        },
        createdBy:{
            type: String,
            required: true,
        },
        assignedDeveloper:{
            type: String,
        },
        taskStatus:{
            type: String,
            required: true,
            enum: ["To Do","In Progress", "In Review", "Done"],
            default: "To Do",
        },
        taskPriority:{
            type: String,
            required: true,
            enum: ["Low", "Medium", "High", "Critical"],
        },
        dueDate:{
            type: Date,
            required: true,
        },
        activityLog:{
            type: String,
        },
}, {timestamps:true},
)