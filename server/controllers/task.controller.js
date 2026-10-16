import mongoose from "mongoose"
import Project from "../models/project.model.js"
import Task from "../models/task.model.js"
import User from "../models/user.model.js"
import ActivityLog from "../models/activityLog.model.js"
import Notification from "../models/notification.model.js"
import {
    emitActivity,
    emitNotification,
    emitTaskChange,
} from "../sockets/events.js"

const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]

// the part of every task query that depends on who is asking
const getTaskScope = async (req) => {
    if (req.user.role === "ADMIN") {
        return {}
    }

    if (req.user.role === "PROJECT_MANAGER") {
        const projectIds = await Project.find({ projectManager: req.user.userId }).distinct("_id")
        return { project: { $in: projectIds } }
    }

    return { assignedTo: req.user.userId }
}

const parseDate = (value, endOfDay) => {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    // a plain date like 2026-10-20 means the end of that day for dueTo
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        date.setUTCHours(23, 59, 59, 999)
    }

    return date
}


export const handleCreateTask = async (req, res) => {
    const { projectId } = req.params
    const { title, description, assignedTo, priority, dueDate } = req.body

    // 1. Validate input
    if (!mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project id"
        })
    }

    if (!title || !assignedTo || !dueDate) {
        return res.status(400).json({
            success: false,
            message: "Title, assigned developer and due date are required"
        })
    }

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            success: false,
            message: "Title must be text"
        })
    }

    if (description !== undefined && typeof description !== "string") {
        return res.status(400).json({
            success: false,
            message: "Description must be text"
        })
    }

    if (!mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({
            success: false,
            message: "Invalid developer id"
        })
    }

    if (priority !== undefined && !TASK_PRIORITIES.includes(priority)) {
        return res.status(400).json({
            success: false,
            message: `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`
        })
    }

    const due = new Date(dueDate)

    if (Number.isNaN(due.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Due date is not a valid date"
        })
    }

    try {
        // 2. Project access: a PM only reaches their own projects
        const access = req.user.role === "PROJECT_MANAGER"
            ? { _id: projectId, projectManager: req.user.userId }
            : { _id: projectId }

        const project = await Project.findOne(access)

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            })
        }

        // 3. The assignee must be an active developer
        const developer = await User.findOne({
            _id: assignedTo,
            role: "DEVELOPER",
            isActive: true
        })

        if (!developer) {
            return res.status(404).json({
                success: false,
                message: "Active developer not found"
            })
        }

        // 4. Next task number, incremented atomically
        const updatedProject = await Project.findByIdAndUpdate(
            project._id,
            { $inc: { taskCounter: 1 } },
            { new: true }
        )

        // 5. Create the task
        const task = await Task.create({
            taskNumber: updatedProject.taskCounter,
            title: title.trim(),
            description: description ? description.trim() : undefined,
            project: project._id,
            assignedTo: developer._id,
            createdBy: req.user.userId,
            priority,
            dueDate: due
        })

        // 6. Activity log rows
        const logs = await ActivityLog.insertMany([
            {
                task: task._id,
                project: project._id,
                assignedTo: developer._id,
                performedBy: req.user.userId,
                action: "TASK_CREATED",
                toValue: "TODO"
            },
            {
                task: task._id,
                project: project._id,
                assignedTo: developer._id,
                performedBy: req.user.userId,
                action: "TASK_ASSIGNED",
                toValue: developer._id.toString()
            }
        ])

        // 7. Notify the developer
        const notification = await Notification.create({
            recipient: developer._id,
            sender: req.user.userId,
            type: "TASK_ASSIGNED",
            title: "New task assigned",
            message: `You were assigned Task #${task.taskNumber}: ${task.title}`,
            project: project._id,
            task: task._id
        })

        const populated = await task.populate("assignedTo", "firstName lastName email")

        // 8. Push the change to everyone watching this project, and the feeds
        emitTaskChange(project._id.toString(), "task:created", populated)
        await emitActivity(logs.map((log) => log._id))
        await emitNotification(notification._id)

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: populated
        })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Task number conflict, please try again"
            })
        }

        console.error("Create Task Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleGetTasks = async (req, res) => {
    const { status, priority, dueFrom, dueTo, project } = req.query

    // each filter must be a single text value
    for (const [key, value] of Object.entries({ status, priority, dueFrom, dueTo, project })) {
        if (value !== undefined && typeof value !== "string") {
            return res.status(400).json({
                success: false,
                message: `${key} must be a single value`
            })
        }
    }

    if (status && !TASK_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${TASK_STATUSES.join(", ")}`
        })
    }

    if (priority && !TASK_PRIORITIES.includes(priority)) {
        return res.status(400).json({
            success: false,
            message: `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`
        })
    }

    if (project && !mongoose.isValidObjectId(project)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project id"
        })
    }

    const from = dueFrom ? parseDate(dueFrom, false) : undefined
    const to = dueTo ? parseDate(dueTo, true) : undefined

    if (from === null || to === null) {
        return res.status(400).json({
            success: false,
            message: "dueFrom and dueTo must be valid dates, for example 2026-10-20"
        })
    }

    try {
        // the role scope always comes first; filters can only narrow it
        const conditions = [await getTaskScope(req)]

        if (status) conditions.push({ status })
        if (priority) conditions.push({ priority })
        if (project) conditions.push({ project })

        if (from || to) {
            const range = {}
            if (from) range.$gte = from
            if (to) range.$lte = to
            conditions.push({ dueDate: range })
        }

        const tasks = await Task.find({ $and: conditions })
            .populate("project", "projectTitle")
            .populate("assignedTo", "firstName lastName email")
            .sort({ priorityRank: -1, dueDate: 1 })

        return res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        })

    } catch (error) {
        console.error("Get Tasks Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleGetTaskById = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task id"
        })
    }

    try {
        const task = await Task.findOne({ $and: [await getTaskScope(req), { _id: id }] })
            .populate("project", "projectTitle")
            .populate("assignedTo", "firstName lastName email")
            .populate("createdBy", "firstName lastName")

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: task
        })

    } catch (error) {
        console.error("Get Task Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleUpdateTask = async (req, res) => {
    const { id } = req.params
    const { title, description, assignedTo, priority, dueDate } = req.body

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task id"
        })
    }

    const updates = {}

    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ success: false, message: "Title cannot be empty" })
        }
        updates.title = title.trim()
    }

    if (description !== undefined) {
        if (typeof description !== "string") {
            return res.status(400).json({ success: false, message: "Description must be text" })
        }
        updates.description = description.trim()
    }

    if (priority !== undefined) {
        if (!TASK_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`
            })
        }
        updates.priority = priority
    }

    if (dueDate !== undefined) {
        const due = new Date(dueDate)
        if (Number.isNaN(due.getTime())) {
            return res.status(400).json({ success: false, message: "Due date is not a valid date" })
        }
        updates.dueDate = due
    }

    if (assignedTo !== undefined) {
        if (!mongoose.isValidObjectId(assignedTo)) {
            return res.status(400).json({ success: false, message: "Invalid developer id" })
        }
        updates.assignedTo = assignedTo
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid fields to update"
        })
    }

    try {
        // same role scope as viewing; a PM only reaches tasks in their projects
        const task = await Task.findOne({ $and: [await getTaskScope(req), { _id: id }] })

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            })
        }

        const oldPriority = task.priority
        const oldDeveloperId = task.assignedTo.toString()

        // a new assignee must be an active developer
        let newDeveloper = null

        if (updates.assignedTo && updates.assignedTo !== oldDeveloperId) {
            newDeveloper = await User.findOne({
                _id: updates.assignedTo,
                role: "DEVELOPER",
                isActive: true
            })

            if (!newDeveloper) {
                return res.status(404).json({
                    success: false,
                    message: "Active developer not found"
                })
            }
        }

        // apply the changes
        if (updates.title !== undefined) task.title = updates.title
        if (updates.description !== undefined) task.description = updates.description
        if (updates.priority !== undefined) task.priority = updates.priority

        if (updates.dueDate !== undefined) {
            task.dueDate = updates.dueDate

            // a due date in the future means the task is no longer overdue
            if (updates.dueDate > new Date()) {
                task.isOverdue = false
            }
        }

        if (newDeveloper) task.assignedTo = newDeveloper._id

        await task.save()

        // activity log rows for the changes that matter to the feed
        const logs = []

        if (updates.priority && updates.priority !== oldPriority) {
            logs.push({
                task: task._id,
                project: task.project,
                assignedTo: task.assignedTo,
                performedBy: req.user.userId,
                action: "PRIORITY_CHANGE",
                fromValue: oldPriority,
                toValue: updates.priority
            })
        }

        if (newDeveloper) {
            logs.push({
                task: task._id,
                project: task.project,
                assignedTo: newDeveloper._id,
                performedBy: req.user.userId,
                action: "TASK_ASSIGNED",
                fromValue: oldDeveloperId,
                toValue: newDeveloper._id.toString()
            })
        }

        let createdLogs = []
        if (logs.length > 0) {
            createdLogs = await ActivityLog.insertMany(logs)
        }

        // tell the new developer
        let notification = null
        if (newDeveloper) {
            notification = await Notification.create({
                recipient: newDeveloper._id,
                sender: req.user.userId,
                type: "TASK_ASSIGNED",
                title: "New task assigned",
                message: `You were assigned Task #${task.taskNumber}: ${task.title}`,
                project: task.project,
                task: task._id
            })
        }

        // remember the project id before populate swaps it for a document
        const projectId = task.project.toString()

        const populated = await task.populate([
            { path: "project", select: "projectTitle" },
            { path: "assignedTo", select: "firstName lastName email" }
        ])

        // everyone watching the project redraws the card, feeds and badges update
        emitTaskChange(projectId, "task:updated", populated)
        await emitActivity(createdLogs.map((log) => log._id))
        if (notification) await emitNotification(notification._id)

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: populated
        })

    } catch (error) {
        console.error("Update Task Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleDeleteTask = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task id"
        })
    }

    try {
        const task = await Task.findOne({ $and: [await getTaskScope(req), { _id: id }] })

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            })
        }

        const projectId = task.project.toString()

        // remove everything that points at this task
        await ActivityLog.deleteMany({ task: task._id })
        await Notification.deleteMany({ task: task._id })
        await task.deleteOne()

        // tell any board showing this project to drop the card
        emitTaskChange(projectId, "task:deleted", { _id: task._id })

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        })

    } catch (error) {
        console.error("Delete Task Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleGetTaskActivity = async (req, res) => {
    const { id } = req.params
    const { limit } = req.query

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task id"
        })
    }

    if (limit !== undefined && typeof limit !== "string") {
        return res.status(400).json({
            success: false,
            message: "limit must be a single number"
        })
    }

    const pageSize = Math.min(Number.parseInt(limit, 10) || 50, 100)

    try {
        // the task must be inside the caller's scope
        const task = await Task.findOne({ $and: [await getTaskScope(req), { _id: id }] }).select("_id")

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            })
        }

        const logs = await ActivityLog.find({ task: task._id })
            .populate("performedBy", "firstName lastName")
            .sort({ createdAt: -1 })
            .limit(pageSize)

        return res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        })

    } catch (error) {
        console.error("Get Task Activity Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleUpdateTaskStatus = async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task id"
        })
    }

    if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${TASK_STATUSES.join(", ")}`
        })
    }

    const session = await mongoose.startSession()

    try {
        const scope = await getTaskScope(req)
        const actor = await User.findById(req.user.userId).select("firstName lastName")

        let result = null
        let createdLog = null
        let createdNotification = null

        await session.withTransaction(async () => {
            // the callback can run again on a retry, so start clean
            result = null
            createdLog = null
            createdNotification = null

            const task = await Task.findOne({ $and: [scope, { _id: id }] }).session(session)

            if (!task) {
                result = { code: 404, message: "Task not found" }
                return
            }

            if (task.status === status) {
                result = { code: 400, message: `Task is already ${status}` }
                return
            }

            const oldStatus = task.status

            task.status = status

            // a finished task is no longer overdue
            if (status === "DONE") {
                task.isOverdue = false
            }

            await task.save({ session })

            const [log] = await ActivityLog.create([{
                task: task._id,
                project: task.project,
                assignedTo: task.assignedTo,
                performedBy: req.user.userId,
                action: "STATUS_CHANGE",
                fromValue: oldStatus,
                toValue: status
            }], { session })
            createdLog = log

            // moving to review notifies the project manager
            if (status === "IN_REVIEW") {
                const project = await Project.findById(task.project)
                    .select("projectManager")
                    .session(session)

                if (project && project.projectManager.toString() !== req.user.userId) {
                    const [notification] = await Notification.create([{
                        recipient: project.projectManager,
                        sender: req.user.userId,
                        type: "TASK_IN_REVIEW",
                        title: "Task ready for review",
                        message: `${actor.firstName} moved Task #${task.taskNumber} to In Review`,
                        project: task.project,
                        task: task._id
                    }], { session })
                    createdNotification = notification
                }
            }

            result = { code: 200, task }
        })

        if (result.code !== 200) {
            return res.status(result.code).json({
                success: false,
                message: result.message
            })
        }

        const projectId = result.task.project.toString()

        const populated = await result.task.populate([
            { path: "project", select: "projectTitle" },
            { path: "assignedTo", select: "firstName lastName email" }
        ])

        // after the transaction commits, fan the change out to the sockets
        emitTaskChange(projectId, "task:updated", populated)
        await emitActivity(createdLog?._id)
        if (createdNotification) await emitNotification(createdNotification._id)

        return res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            data: populated
        })

    } catch (error) {
        console.error("Update Task Status Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })

    } finally {
        await session.endSession()
    }
}

export default { handleCreateTask, handleGetTasks, handleGetTaskById, handleUpdateTask, handleDeleteTask, handleGetTaskActivity, handleUpdateTaskStatus}