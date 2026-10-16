import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { api } from "../app/api/apiSlice.js"
import { connectSocket, disconnectSocket } from "./socket.js"
import { pushActivity } from "../features/activity/activitySlice.js"
import { pushNotification, setUnreadCount } from "../features/notifications/notificationsSlice.js"
import { setOnlineCount } from "../features/presence/presenceSlice.js"
import { loggedOut } from "../features/auth/authSlice.js"

// Mounted once, while a user is signed in. It opens the socket and turns server
// events into Redux actions and cache invalidations.
const SocketBridge = () => {
    const dispatch = useDispatch()
    const accessToken = useSelector((state) => state.auth.accessToken)
    const role = useSelector((state) => state.auth.user?.role)

    useEffect(() => {
        if (!accessToken) return undefined

        const socket = connectSocket(accessToken)

        socket.on("connect", () => {
            // on connect and on every reconnect, pull the last 20 events the
            // user missed straight from the database (never memory)
            dispatch(api.util.invalidateTags(["Activity", "Notification", "Task"]))
        })

        socket.on("connect_error", (error) => {
            // an expired token cannot be recovered here; the API layer handles it
            if (error?.message?.includes("token")) {
                dispatch(loggedOut())
            }
        })

        socket.on("activity:new", (row) => dispatch(pushActivity(row)))

        socket.on("notification:new", (payload) => {
            dispatch(pushNotification(payload))
            dispatch(api.util.invalidateTags(["Notification"]))
        })

        socket.on("notification:count", (payload) => {
            dispatch(setUnreadCount(payload.unreadCount))
        })

        socket.on("presence:count", (payload) => {
            dispatch(setOnlineCount(payload.count))
        })

        // a task changed somewhere: refresh the board and lists that show it
        const refreshTasks = () => {
            dispatch(api.util.invalidateTags(["Task", "Activity"]))
        }

        socket.on("task:created", refreshTasks)
        socket.on("task:updated", refreshTasks)
        socket.on("task:deleted", refreshTasks)

        const refreshProjects = () => {
            dispatch(api.util.invalidateTags(["Project"]))
        }

        socket.on("project:created", refreshProjects)
        socket.on("project:updated", refreshProjects)
        socket.on("project:deleted", refreshProjects)

        return () => {
            disconnectSocket()
        }
    }, [accessToken, role, dispatch])

    return null
}

export default SocketBridge
