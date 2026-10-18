import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import User from "../models/user.model.js"
import Project from "../models/project.model.js"

let io

// userId -> number of open sockets; a user may have several tabs open
const onlineUsers = new Map()

const presenceCount = () => onlineUsers.size

// the admin dashboard shows how many people are online right now
const broadcastPresence = () => {
    if (!io) return
    io.to("admin").emit("presence:count", { count: presenceCount() })
}

// a socket may only join a project room it is actually allowed to read.
//
// A developer never qualifies. A project room carries every task in the
// project, and a developer may only ever read the tasks assigned to them, so
// letting them join would leak the rest of the board. Their own task changes
// arrive in their private user room instead (see emitTaskChange).
const canAccessProject = async (user, projectId) => {
    if (user.role === "ADMIN") return true

    if (user.role === "PROJECT_MANAGER") {
        return Boolean(
            await Project.exists({
                _id: projectId,
                projectManager: user.userId,
            }),
        )
    }

    return false
}

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true,
        },
    })

    // runs once for every connection attempt
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token

            if (!token) {
                return next(new Error("Access token is required"))
            }

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

            // role and active status come from the database, not the token
            const user = await User.findById(decoded.userId).select(
                "role isActive",
            )

            if (!user || !user.isActive) {
                return next(new Error("Account not available"))
            }

            socket.user = { userId: user._id.toString(), role: user.role }
            next()
        } catch (error) {
            next(new Error("Invalid or expired access token"))
        }
    })

    io.on("connection", (socket) => {
        const { userId, role } = socket.user

        // private room: notifications and personal feed rows for one person
        socket.join(`user:${userId}`)

        if (role === "ADMIN") {
            socket.join("admin")
        }

        // presence: count this socket, tell the admins, and tell the newcomer
        onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1)
        broadcastPresence()
        socket.emit("presence:count", { count: presenceCount() })

        console.log(`Socket connected: ${role} ${userId}`)

        // a client opening a project asks to join that project's room
        socket.on("project:join", async (projectId, ack) => {
            if (!mongoose.isValidObjectId(projectId)) {
                return ack?.({ ok: false, message: "Invalid project id" })
            }

            const allowed = await canAccessProject(socket.user, projectId)

            if (!allowed) {
                return ack?.({ ok: false, message: "Access denied" })
            }

            socket.join(`project:${projectId}`)
            ack?.({ ok: true })
        })

        socket.on("project:leave", (projectId) => {
            if (mongoose.isValidObjectId(projectId)) {
                socket.leave(`project:${projectId}`)
            }
        })

        socket.on("disconnect", () => {
            const remaining = (onlineUsers.get(userId) || 1) - 1

            if (remaining > 0) {
                onlineUsers.set(userId, remaining)
            } else {
                onlineUsers.delete(userId)
            }

            broadcastPresence()
            console.log(`Socket disconnected: ${role} ${userId}`)
        })
    })

    return io
}

// other files use this to emit events after a database write
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialised")
    }
    return io
}

// the current count, for anything that needs it outside the socket
export const getPresenceCount = () => presenceCount()
