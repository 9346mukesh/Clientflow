import mongoose from "mongoose";

const PRIORITY_RANK = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
};

const taskSchema = new mongoose.Schema(
    {
        // per-project number shown as "Task #12"; comes from project.taskCounter
        taskNumber: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        // the developer working on this task
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Admin or PM who created it (set from req.user.id, never from the body)
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
            default: "TODO"
        },

        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM"
        },

        // numeric copy of priority, used only so sorting works correctly
        priorityRank: {
            type: Number,
            default: 2
        },

        dueDate: {
            type: Date,
            required: true
        },

        // set to true by the cron job; reset when DONE or dueDate moves forward
        isOverdue: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// keep priorityRank in sync whenever priority is set or changed via save()
taskSchema.pre("save", function () {
    if (this.isModified("priority") || this.isNew) {
        this.priorityRank = PRIORITY_RANK[this.priority];
    }
});

// task numbers are unique inside a project
taskSchema.index({ project: 1, taskNumber: 1 }, { unique: true });

// Kanban board and filters inside a project
taskSchema.index({ project: 1, status: 1, priority: 1 });

// developer dashboard: my tasks, priority first, then due date
taskSchema.index({ assignedTo: 1, priorityRank: -1, dueDate: 1 });

// overdue cron job and admin overdue count
taskSchema.index({ isOverdue: 1, dueDate: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;