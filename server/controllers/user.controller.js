import mongoose from "mongoose"
import bcrypt from "bcrypt"
import User from "../models/user.model.js"
import Project from "../models/project.model.js"

const VALID_ROLES = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]

export const handleCreateUser = async (req, res) => {
    const { firstName, lastName, email, password, gender, jobTitle, role } =
        req.body

    // 1. Validate input
    if (!firstName || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message:
                "First name, email, temporary password and role are required",
        })
    }

    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Role must be ADMIN, PROJECT_MANAGER or DEVELOPER",
        })
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters",
        })
    }

    try {
        // 2. Normalize email and check for duplicates
        const normalizedEmail = email.toLowerCase().trim()

        const existingUser = await User.findOne({ email: normalizedEmail })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            })
        }

        // 3. Hash the temporary password
        const hashedPassword = await bcrypt.hash(password, 10)

        // 4. Create the user; createdBy comes from the token, never the body
        const newUser = await User.create({
            firstName: firstName.trim(),
            lastName: lastName ? lastName.trim() : "",
            email: normalizedEmail,
            password: hashedPassword,
            gender,
            jobTitle,
            role,
            mustChangePassword: true,
            createdBy: req.user.userId,
        })

        // 5. Return safe fields only
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role,
                jobTitle: newUser.jobTitle,
                isActive: newUser.isActive,
                mustChangePassword: newUser.mustChangePassword,
            },
        })
    } catch (error) {
        console.error("Create User Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleGetUsers = async (req, res) => {
    try {
        const filter = {}

        // optional filters: ?role=DEVELOPER&isActive=true
        if (req.query.role) {
            if (!VALID_ROLES.includes(req.query.role)) {
                return res.status(400).json({
                    success: false,
                    message: "Role must be ADMIN, PROJECT_MANAGER or DEVELOPER",
                })
            }
            filter.role = req.query.role
        }

        if (req.query.isActive === "true") filter.isActive = true
        if (req.query.isActive === "false") filter.isActive = false

        // password is already hidden (select: false in the schema)
        const users = await User.find(filter).sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        })
    } catch (error) {
        console.error("Get Users Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleGetDevelopers = async (req, res) => {
    try {
        // only active developers, and only the fields a dropdown needs
        const developers = await User.find({
            role: "DEVELOPER",
            isActive: true,
        })
            .select("firstName lastName email jobTitle")
            .sort({ firstName: 1 })

        return res.status(200).json({
            success: true,
            count: developers.length,
            data: developers,
        })
    } catch (error) {
        console.error("Get Developers Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleUpdateUser = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user id",
        })
    }

    const { firstName, lastName, jobTitle, gender, role, isActive } = req.body
    const updates = {}

    if (firstName !== undefined) {
        if (!firstName.trim() || firstName.trim().length < 2) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "First name must be at least 2 characters",
                })
        }
        updates.firstName = firstName.trim()
    }

    if (lastName !== undefined) updates.lastName = lastName.trim()
    if (jobTitle !== undefined) updates.jobTitle = jobTitle.trim()

    if (gender !== undefined) {
        if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Gender must be MALE, FEMALE or OTHER",
                })
        }
        updates.gender = gender
    }

    if (role !== undefined) {
        if (!VALID_ROLES.includes(role)) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Role must be ADMIN, PROJECT_MANAGER or DEVELOPER",
                })
        }
        updates.role = role
    }

    if (isActive !== undefined) {
        if (typeof isActive !== "boolean") {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "isActive must be true or false",
                })
        }
        updates.isActive = isActive
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid fields to update",
        })
    }

    // an admin cannot lock themselves out
    const isSelf = req.user.userId === id
    if (
        isSelf &&
        (updates.isActive === false ||
            (updates.role && updates.role !== "ADMIN"))
    ) {
        return res.status(400).json({
            success: false,
            message:
                "You cannot deactivate or change the role of your own account",
        })
    }

    try {
        const user = await User.findById(id)
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" })
        }

        // a PM who owns projects cannot be moved to another role
        if (
            updates.role &&
            updates.role !== user.role &&
            user.role === "PROJECT_MANAGER"
        ) {
            const ownsProjects = await Project.exists({
                projectManager: user._id,
            })
            if (ownsProjects) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This project manager still manages projects. Reassign them first.",
                })
            }
        }

        Object.assign(user, updates)
        await user.save()

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        })
    } catch (error) {
        console.error("Update User Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export default {
    handleCreateUser,
    handleGetUsers,
    handleGetDevelopers,
    handleUpdateUser,
}
