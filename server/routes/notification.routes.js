import express from "express"
import {
    handleGetNotifications,
    handleGetUnreadCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
} from "../controllers/notification.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"

const router = express.Router()

// everyone reads their own notifications
router.get("/", authMiddleware, handleGetNotifications)
router.get("/unread-count", authMiddleware, handleGetUnreadCount)
router.patch("/read-all", authMiddleware, handleMarkAllNotificationsRead)
router.patch("/:id/read", authMiddleware, handleMarkNotificationRead)

export default router
