import Client from "../models/client.model.js"
import mongoose from "mongoose"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const handleCreateClient = async (req, res) => {
    const { clientName, companyName, email, phone } = req.body

    // 1. Validate input
    if (!clientName || !companyName || !email) {
        return res.status(400).json({
            success: false,
            message: "Client name, company name and email are required",
        })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email",
        })
    }

    try {
        // 2. Check for duplicates
        const existingClient = await Client.findOne({ email: normalizedEmail })
        if (existingClient) {
            return res.status(409).json({
                success: false,
                message: "A client with this email already exists",
            })
        }

        // 3. Create; createdBy comes from the token, never the body
        const client = await Client.create({
            clientName: clientName.trim(),
            companyName: companyName.trim(),
            email: normalizedEmail,
            phone: phone ? phone.trim() : undefined,
            createdBy: req.user.userId,
        })

        return res.status(201).json({
            success: true,
            message: "Client created successfully",
            data: client,
        })
    } catch (error) {
        console.error("Create Client Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleGetClients = async (req, res) => {
    try {
        const filter = {}

        if (req.user.role === "ADMIN") {
            // admin can see everything, or filter with ?isActive=true / false
            if (req.query.isActive === "true") filter.isActive = true
            if (req.query.isActive === "false") filter.isActive = false
        } else {
            // PM only sees active clients
            filter.isActive = true
        }

        const clients = await Client.find(filter).sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            count: clients.length,
            data: clients,
        })
    } catch (error) {
        console.error("Get Clients Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleUpdateClient = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid client id",
        })
    }

    // only these fields can be changed
    const { clientName, companyName, email, phone, isActive } = req.body
    const updates = {}

    if (clientName !== undefined) {
        if (!clientName.trim()) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Client name cannot be empty",
                })
        }
        updates.clientName = clientName.trim()
    }

    if (companyName !== undefined) {
        if (!companyName.trim()) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Company name cannot be empty",
                })
        }
        updates.companyName = companyName.trim()
    }

    if (email !== undefined) {
        const normalizedEmail = email.toLowerCase().trim()
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Please provide a valid email",
                })
        }
        updates.email = normalizedEmail
    }

    if (phone !== undefined) updates.phone = phone.trim()

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

    try {
        // email must stay unique across other clients
        if (updates.email) {
            const duplicate = await Client.findOne({
                email: updates.email,
                _id: { $ne: id },
            })
            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "Another client already uses this email",
                })
            }
        }

        const client = await Client.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        })

        if (!client) {
            return res
                .status(404)
                .json({ success: false, message: "Client not found" })
        }

        return res.status(200).json({
            success: true,
            message: "Client updated successfully",
            data: client,
        })
    } catch (error) {
        console.error("Update Client Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleDeleteClient = async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid client id",
        })
    }

    try {
        // soft delete: projects keep pointing at a real client
        const client = await Client.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true },
        )

        if (!client) {
            return res
                .status(404)
                .json({ success: false, message: "Client not found" })
        }

        return res.status(200).json({
            success: true,
            message: "Client deactivated successfully",
            data: client,
        })
    } catch (error) {
        console.error("Delete Client Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export default {
    handleCreateClient,
    handleGetClients,
    handleUpdateClient,
    handleDeleteClient,
}
