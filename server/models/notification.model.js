import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
    {
        // who receives the notification
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // who triggered it; empty for system events like TASK_OVERDUE
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        type: {
            type: String,
            enum: ["TASK_ASSIGNED", "TASK_IN_REVIEW", "TASK_OVERDUE"],
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
)

// badge count (recipient + isRead) and dropdown list (newest first)
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

// auto-delete notifications after 90 days
notificationSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 90 },
)

// mark all unread notifications of one user as read
notificationSchema.statics.markAllAsRead = function (recipientId) {
    return this.updateMany(
        { recipient: recipientId, isRead: false },
        { $set: { isRead: true } },
    )
}

const Notification = mongoose.model("Notification", notificationSchema)

export default Notification
