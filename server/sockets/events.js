import { getIO } from "./socket.js"
import ActivityLog from "../models/activityLog.model.js"
import Notification from "../models/notification.model.js"

// one shape for every feed row, whether it arrived over the socket or the API
export const serializeActivity = (log) => ({
    _id: log._id,
    action: log.action,
    fromValue: log.fromValue ?? null,
    toValue: log.toValue ?? null,
    createdAt: log.createdAt,
    performedBy: log.performedBy
        ? {
            _id: log.performedBy._id,
            firstName: log.performedBy.firstName ?? "",
            lastName: log.performedBy.lastName ?? "",
        }
        : null,
    project: log.project
        ? {
            _id: log.project._id ?? log.project,
            projectTitle: log.project.projectTitle ?? null,
        }
        : null,
    task: log.task
        ? {
            _id: log.task._id ?? log.task,
            taskNumber: log.task.taskNumber ?? null,
            title: log.task.title ?? null,
        }
        : null,
    assignedTo: log.assignedTo ?? null,
})

// the populate every feed uses, so REST and sockets always agree
export const ACTIVITY_POPULATE = [
    { path: "performedBy", select: "firstName lastName" },
    { path: "project", select: "projectTitle projectManager" },
    { path: "task", select: "taskNumber title" },
]

// send freshly written activity rows to everyone who should see them
export const emitActivity = async (ids) => {
    const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean)
    if (list.length === 0) return

    const logs = await ActivityLog.find({ _id: { $in: list } }).populate(
        ACTIVITY_POPULATE,
    )

    const io = getIO()

    for (const log of logs) {
        const payload = serializeActivity(log)

        // everyone currently viewing that project sees the change right away
        if (log.project?._id) {
            io.to(`project:${log.project._id}`).emit("activity:new", payload)
        }

        // the admin global feed
        io.to("admin").emit("activity:new", payload)

        // the owning PM and the developer on the task keep their feeds live
        if (log.project?.projectManager) {
            io.to(`user:${log.project.projectManager}`).emit(
                "activity:new",
                payload,
            )
        }
        if (log.assignedTo) {
            io.to(`user:${log.assignedTo}`).emit("activity:new", payload)
        }
    }
}

// board updates: let everyone viewing the project redraw without refreshing.
//
// A developer is deliberately never in a project room, because that room
// carries every task in the project. Their own task changes are delivered to
// their private user room through `extraRooms`, so the project room stays
// exactly the set of people who may read the whole project.
export const emitTaskChange = (projectId, event, payload, extraRooms = []) => {
    if (!projectId) return

    const io = getIO()

    io.to(`project:${projectId}`).emit(event, payload)

    for (const room of new Set(extraRooms.filter(Boolean))) {
        io.to(room).emit(event, payload)
    }
}

// project list updates for admins and the owning PM
export const emitProjectChange = (event, payload, extraRooms = []) => {
    const io = getIO()
    io.to("admin").emit(event, payload)
    for (const room of extraRooms) io.to(room).emit(event, payload)
}

// a new notification plus the recipient's fresh unread count
export const emitNotification = async (id) => {
    const notification = await Notification.findById(id)
    if (!notification) return

    const unreadCount = await Notification.countDocuments({
        recipient: notification.recipient,
        isRead: false,
    })

    getIO().to(`user:${notification.recipient}`).emit("notification:new", {
        notification,
        unreadCount,
    })
}

// after a read, push the corrected badge count to every tab of that user
export const emitUnreadCount = async (recipientId) => {
    const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        isRead: false,
    })

    getIO()
        .to(`user:${recipientId}`)
        .emit("notification:count", { unreadCount })
}
