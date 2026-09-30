import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },

        // copied from the task at event time, so feeds need no joins
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        // the developer the task belonged to when this event happened
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // who made the change; for the cron job, use the task's project manager
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        action: {
            type: String,
            enum: [
                "TASK_CREATED",
                "STATUS_CHANGE",
                "TASK_ASSIGNED",
                "PRIORITY_CHANGE",
                "MARKED_OVERDUE"
            ],
            required: true
        },

        // e.g. "IN_PROGRESS" -> "IN_REVIEW", or old developer id -> new developer id
        fromValue: {
            type: String
        },

        toValue: {
            type: String
        }
    },
    // logs are never edited, so no updatedAt
    { timestamps: { createdAt: true, updatedAt: false } }
);

// one task's history
activityLogSchema.index({ task: 1, createdAt: -1 });

// PM feed: project in [my projects], newest first
activityLogSchema.index({ project: 1, createdAt: -1 });

// developer feed: only events on tasks assigned to me
activityLogSchema.index({ assignedTo: 1, createdAt: -1 });

// admin global feed
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;