import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { api } from "../app/api/apiSlice.js"
import { connectSocket, disconnectSocket } from "./socket.js"
import { pushActivity } from "../features/activity/activitySlice.js"
import { pushNotification, setUnreadCount } from "../features/notifications/notificationsSlice.js"
import { setOnlineCount } from "../features/presence/presenceSlice.js"
import { loggedOut } from "../features/auth/authSlice.js"

// Mounted once while a user is signed in. It opens the socket and turns server
// events into Redux actions and cache invalidations.
//
// The socket connection is owned by the app (see sockets/socket.js), not by this
// component. So this effect only attaches and detaches listeners: a StrictMode
// remount, or any re-render, never disconnects a live socket. The connection is
// closed only when the user signs out (no access token).
const SocketBridge = () => {
    const dispatch = useDispatch()
    const accessToken = useSelector((state) => state.auth.accessToken)
    const role = useSelector((state) => state.auth.user?.role)

    useEffect(() => {
        if (!accessToken) {
            disconnectSocket()
            return undefined
        }

        const socket = connectSocket(accessToken)

        const onConnect = () => {
            // on connect and on every reconnect, pull the last 20 events the
            // user missed straight from the database (never memory)
            dispatch(api.util.invalidateTags(["Activity", "Notification", "Task"]))
        }

        const onConnectError = (error) => {
            // an expired token cannot be recovered here; the API layer handles it
            if (error?.message?.includes("token")) {
                dispatch(loggedOut())
            }
        }

        const onActivity = (row) => dispatch(pushActivity(row))

        const onNotification = (payload) => {
            dispatch(pushNotification(payload))
            dispatch(api.util.invalidateTags(["Notification"]))
        }

        const onNotificationCount = (payload) =>
            dispatch(setUnreadCount(payload.unreadCount))

        const onPresence = (payload) => dispatch(setOnlineCount(payload.count))

        // a task changed somewhere: refresh the board and lists that show it
        const refreshTasks = () =>
            dispatch(api.util.invalidateTags(["Task", "Activity"]))

        const refreshProjects = () =>
            dispatch(api.util.invalidateTags(["Project"]))

        socket.on("connect", onConnect)
        socket.on("connect_error", onConnectError)
        socket.on("activity:new", onActivity)
        socket.on("notification:new", onNotification)
        socket.on("notification:count", onNotificationCount)
        socket.on("presence:count", onPresence)
        socket.on("task:created", refreshTasks)
        socket.on("task:updated", refreshTasks)
        socket.on("task:deleted", refreshTasks)
        socket.on("project:created", refreshProjects)
        socket.on("project:updated", refreshProjects)
        socket.on("project:deleted", refreshProjects)

        return () => {
            // detach only; the connection stays open for the next mount
            socket.off("connect", onConnect)
            socket.off("connect_error", onConnectError)
            socket.off("activity:new", onActivity)
            socket.off("notification:new", onNotification)
            socket.off("notification:count", onNotificationCount)
            socket.off("presence:count", onPresence)
            socket.off("task:created", refreshTasks)
            socket.off("task:updated", refreshTasks)
            socket.off("task:deleted", refreshTasks)
            socket.off("project:created", refreshProjects)
            socket.off("project:updated", refreshProjects)
            socket.off("project:deleted", refreshProjects)
        }
    }, [accessToken, role, dispatch])

    return null
}

export default SocketBridge
