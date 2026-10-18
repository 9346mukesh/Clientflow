import mongoose from "mongoose"
import ActivityLog from "../models/activityLog.model.js"
import Project from "../models/project.model.js"
import {
    ACTIVITY_POPULATE,
    serializeActivity,
} from "../sockets/events.js"

// the feed each role is allowed to read, from the same rules as the tasks
export const getActivityScope = async (req) => {
    if (req.user.role === "ADMIN") {
        return {}
    }

    if (req.user.role === "PROJECT_MANAGER") {
        const projectIds = await Project.find({
            projectManager: req.user.userId,
        }).distinct("_id")

        return { project: { $in: projectIds } }
    }

    // a developer only ever sees events on tasks assigned to them
    return { assignedTo: req.user.userId }
}

export const handleGetActivity = async (req, res) => {
    const { limit, before, project } = req.query

    for (const [key, value] of Object.entries({ limit, before, project })) {
        if (value !== undefined && typeof value !== "string") {
            return res.status(400).json({
                success: false,
                message: `${key} must be a single value`,
            })
        }
    }

    if (project && !mongoose.isValidObjectId(project)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project id",
        })
    }

    const beforeDate = before ? new Date(before) : undefined

    if (before && Number.isNaN(beforeDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: "before must be a valid date",
        })
    }

    // the reconnect flow asks for the last 20 events from the database
    const pageSize = Math.min(Number.parseInt(limit, 10) || 20, 100)

    try {
        // the role scope always comes first; filters can only narrow it
        const conditions = [await getActivityScope(req)]

        if (project) conditions.push({ project })
        if (beforeDate) conditions.push({ createdAt: { $lt: beforeDate } })

        const logs = await ActivityLog.find({ $and: conditions })
            .populate(ACTIVITY_POPULATE)
            // _id breaks time ties. A task is created and assigned in one write,
            // so both rows land on the same millisecond and the ids — which are
            // monotonic — are what put the newer event first.
            .sort({ createdAt: -1, _id: -1 })
            .limit(pageSize)

        return res.status(200).json({
            success: true,
            count: logs.length,
            data: logs.map(serializeActivity),
        })
    } catch (error) {
        console.error("Get Activity Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export default { handleGetActivity }
