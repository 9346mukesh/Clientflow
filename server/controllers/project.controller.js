import mongoose from "mongoose"
import Project from "../models/project.model.js"
import Client from "../models/client.model.js"
import User from "../models/user.model.js"
import Task from "../models/task.model.js"
import { emitProjectChange } from "../sockets/events.js"

const PROJECT_STATUSES = [
    "REQUIREMENT_ANALYSIS",
    "DESIGN",
    "DEVELOPMENT",
    "TESTING",
    "DEPLOYMENT",
    "DELIVERED",
]

export const handleCreateProject = async (req, res) => {
    const { projectTitle, projectDescription, client, projectManager, status } =
        req.body

    // 1. Validate input
    if (!projectTitle || !projectDescription || !client) {
        return res.status(400).json({
            success: false,
            message: "Project title, description and client are required",
        })
    }

    if (
        typeof projectTitle !== "string" ||
        typeof projectDescription !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Project title and description must be text",
        })
    }

    if (!mongoose.isValidObjectId(client)) {
        return res.status(400).json({
            success: false,
            message: "Invalid client id",
        })
    }

    if (status !== undefined && !PROJECT_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${PROJECT_STATUSES.join(", ")}`,
        })
    }

    try {
        // 2. The client must exist and be active
        const clientDoc = await Client.findOne({ _id: client, isActive: true })
        if (!clientDoc) {
            return res.status(404).json({
                success: false,
                message: "Client not found or inactive",
            })
        }

        // 3. Decide who the project manager is
        let managerId

        if (req.user.role === "PROJECT_MANAGER") {
            // a PM always owns what they create; the body is ignored
            managerId = req.user.userId
        } else {
            if (!projectManager || !mongoose.isValidObjectId(projectManager)) {
                return res.status(400).json({
                    success: false,
                    message: "A valid project manager id is required",
                })
            }

            const manager = await User.findOne({
                _id: projectManager,
                role: "PROJECT_MANAGER",
                isActive: true,
            })

            if (!manager) {
                return res.status(404).json({
                    success: false,
                    message: "Active project manager not found",
                })
            }

            managerId = manager._id
        }

        // 4. Create the project
        const project = await Project.create({
            projectTitle: projectTitle.trim(),
            projectDescription: projectDescription.trim(),
            client: clientDoc._id,
            createdBy: req.user.userId,
            projectManager: managerId,
            status,
        })

        const populated = await project.populate([
            { path: "client", select: "clientName companyName" },
            { path: "projectManager", select: "firstName lastName email" },
        ])

        // admins and the owning PM keep their project lists fresh
        emitProjectChange("project:created", populated, [`user:${managerId}`])

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: populated,
        })
    } catch (error) {
        // duplicate (client + title) from the unique index
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This client already has a project with that title",
            })
        }

        console.error("Create Project Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleGetProjects = async (req, res) => {
    try {
        const filter = {}

        // a PM only ever sees their own projects (enforced in the query)
        if (req.user.role === "PROJECT_MANAGER") {
            filter.projectManager = req.user.userId
        }

        // optional filters: ?status=DEVELOPMENT&client=<id>
        if (req.query.status) {
            if (!PROJECT_STATUSES.includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status must be one of: ${PROJECT_STATUSES.join(", ")}`,
                })
            }
            filter.status = req.query.status
        }

        if (req.query.client) {
            if (!mongoose.isValidObjectId(req.query.client)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid client id",
                })
            }
            filter.client = req.query.client
        }

        const projects = await Project.find(filter)
            .populate("client", "clientName companyName")
            .populate("projectManager", "firstName lastName email")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        })
    } catch (error) {
        console.error("Get Projects Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}


// a PM can only reach projects where they are the manager
const projectFilter = (req, id) => {
    if (req.user.role === "PROJECT_MANAGER") {
        return { _id: id, projectManager: req.user.userId }
    }
    return { _id: id }
}

export const handleGetProjectById = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project id"
        })
    }

    try {
        const project = await Project.findOne(projectFilter(req, id))
            .populate("client", "clientName companyName email")
            .populate("projectManager", "firstName lastName email")

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: project
        })

    } catch (error) {
        console.error("Get Project Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleUpdateProject = async (req, res) => {
    const { id } = req.params
    const { projectTitle, projectDescription, status, projectManager } = req.body

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project id"
        })
    }

    const updates = {}

    if (projectTitle !== undefined) {
        if (typeof projectTitle !== "string" || !projectTitle.trim()) {
            return res.status(400).json({ success: false, message: "Project title cannot be empty" })
        }
        updates.projectTitle = projectTitle.trim()
    }

    if (projectDescription !== undefined) {
        if (typeof projectDescription !== "string" || !projectDescription.trim()) {
            return res.status(400).json({ success: false, message: "Project description cannot be empty" })
        }
        updates.projectDescription = projectDescription.trim()
    }

    if (status !== undefined) {
        if (!PROJECT_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${PROJECT_STATUSES.join(", ")}`
            })
        }
        updates.status = status
    }

    if (projectManager !== undefined) {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only an admin can reassign a project"
            })
        }
        if (!mongoose.isValidObjectId(projectManager)) {
            return res.status(400).json({ success: false, message: "Invalid project manager id" })
        }
        updates.projectManager = projectManager
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid fields to update"
        })
    }

    try {
        const project = await Project.findOne(projectFilter(req, id))

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            })
        }

        // the new manager must be an active PM
        if (updates.projectManager) {
            const manager = await User.findOne({
                _id: updates.projectManager,
                role: "PROJECT_MANAGER",
                isActive: true
            })

            if (!manager) {
                return res.status(404).json({
                    success: false,
                    message: "Active project manager not found"
                })
            }
        }

        Object.assign(project, updates)
        await project.save()

        const populated = await project.populate([
            { path: "client", select: "clientName companyName" },
            { path: "projectManager", select: "firstName lastName email" }
        ])

        // a reassignment moves the project between PM dashboards
        emitProjectChange("project:updated", populated, [
            `user:${project.projectManager._id ?? project.projectManager}`,
        ])

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: populated
        })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This client already has a project with that title"
            })
        }

        console.error("Update Project Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export const handleDeleteProject = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project id"
        })
    }

    try {
        const project = await Project.findOne(projectFilter(req, id))

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            })
        }

        // do not leave tasks pointing at a missing project
        const hasTasks = await Task.exists({ project: project._id })

        if (hasTasks) {
            return res.status(409).json({
                success: false,
                message: "This project still has tasks and cannot be deleted"
            })
        }

        await project.deleteOne()

        // drop it from every list that was showing it
        emitProjectChange("project:deleted", { _id: project._id }, [
            `user:${project.projectManager}`,
        ])

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        })

    } catch (error) {
        console.error("Delete Project Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred"
        })
    }
}

export default { handleCreateProject, handleGetProjects, handleGetProjectById, handleUpdateProject, handleDeleteProject }
