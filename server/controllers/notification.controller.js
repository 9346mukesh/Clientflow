import mongoose from "mongoose"
import Notification from "../models/notification.model.js"
import { emitUnreadCount } from "../sockets/events.js"

// how many unread notifications this user has (badge count)
const countUnread = (recipientId) =>
    Notification.countDocuments({ recipient: recipientId, isRead: false })

export const handleGetNotifications = async (req, res) => {
    const { unread, limit } = req.query

    if (unread !== undefined && unread !== "true" && unread !== "false") {
        return res.status(400).json({
            success: false,
            message: "unread must be true or false",
        })
    }

    if (limit !== undefined && typeof limit !== "string") {
        return res.status(400).json({
            success: false,
            message: "limit must be a single number",
        })
    }

    // the dropdown shows the newest first; 30 is plenty for a list
    const pageSize = Math.min(Number.parseInt(limit, 10) || 30, 100)

    const filter = { recipient: req.user.userId }
    if (unread === "true") filter.isRead = false

    try {
        const notifications = await Notification.find(filter)
            .populate("sender", "firstName lastName")
            .populate("project", "projectTitle")
            .populate("task", "taskNumber title")
            .sort({ createdAt: -1 })
            .limit(pageSize)

        const unreadCount = await countUnread(req.user.userId)

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications,
        })
    } catch (error) {
        console.error("Get Notifications Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleGetUnreadCount = async (req, res) => {
    try {
        const unreadCount = await countUnread(req.user.userId)

        return res.status(200).json({
            success: true,
            data: { unreadCount },
        })
    } catch (error) {
        console.error("Get Unread Count Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleMarkNotificationRead = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification id",
        })
    }

    try {
        // the recipient check stops one user reading another's notification
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user.userId },
            { isRead: true },
            { new: true },
        )

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            })
        }

        // keep every open tab's badge in step
        await emitUnreadCount(req.user.userId)

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        })
    } catch (error) {
        console.error("Mark Notification Read Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleMarkAllNotificationsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.userId)
        await emitUnreadCount(req.user.userId)

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        })
    } catch (error) {
        console.error("Mark All Notifications Read Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export default {
    handleGetNotifications,
    handleGetUnreadCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
}
