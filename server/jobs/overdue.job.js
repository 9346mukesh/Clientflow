import cron from "node-cron"
import mongoose from "mongoose"
import Task from "../models/task.model.js"
import Project from "../models/project.model.js"
import ActivityLog from "../models/activityLog.model.js"
import Notification from "../models/notification.model.js"
import {
    emitActivity,
    emitNotification,
    emitTaskChange,
} from "../sockets/events.js"

// one sweep: flag every late task, then log and notify. Safe to run any time.
export const runOverdueSweep = async () => {
    // never touch the database before the connection is ready
    if (mongoose.connection.readyState !== 1) {
        return { flagged: 0 }
    }

    const now = new Date()

    // late, not finished, and not already flagged
    const overdue = await Task.find({
        isOverdue: false,
        status: { $ne: "DONE" },
        dueDate: { $lt: now },
    }).select("_id taskNumber title project assignedTo")

    if (overdue.length === 0) {
        return { flagged: 0 }
    }

    const logs = []
    const notifications = []

    for (const task of overdue) {
        const project = await Project.findById(task.project).select(
            "projectManager",
        )

        if (!project) continue

        // the guard in the filter keeps a concurrent sweep from double-flagging
        const updated = await Task.updateOne(
            { _id: task._id, isOverdue: false },
            { $set: { isOverdue: true } },
        )

        if (updated.modifiedCount === 0) continue

        logs.push({
            task: task._id,
            project: task.project,
            assignedTo: task.assignedTo,
            // a system event, attributed to the PM who owns the project
            performedBy: project.projectManager,
            action: "MARKED_OVERDUE",
            fromValue: "false",
            toValue: "true",
        })

        // warn the developer and the project manager
        for (const recipient of [task.assignedTo, project.projectManager]) {
            if (!recipient) continue

            notifications.push({
                recipient,
                type: "TASK_OVERDUE",
                title: "Task overdue",
                message: `Task #${task.taskNumber} (${task.title}) is past its due date`,
                project: task.project,
                task: task._id,
            })
        }

        // any board watching this project redraws the card immediately, and the
        // assignee hears about it in their private room
        emitTaskChange(
            task.project.toString(),
            "task:updated",
            {
                _id: task._id,
                isOverdue: true,
            },
            [task.assignedTo ? `user:${task.assignedTo}` : null],
        )
    }

    if (logs.length > 0) {
        const created = await ActivityLog.insertMany(logs)
        await emitActivity(created.map((log) => log._id))
    }

    if (notifications.length > 0) {
        const created = await Notification.insertMany(notifications)

        for (const notification of created) {
            await emitNotification(notification._id)
        }
    }

    return { flagged: logs.length }
}

export const startOverdueJob = () => {
    // five minutes is frequent enough to feel automatic without churn
    cron.schedule("*/5 * * * *", () => {
        runOverdueSweep().catch((error) =>
            console.error("Overdue job failed:", error),
        )
    })

    // run once shortly after boot so a stale database is corrected quickly
    setTimeout(() => {
        runOverdueSweep().catch((error) =>
            console.error("Overdue job failed:", error),
        )
    }, 5000)
}
