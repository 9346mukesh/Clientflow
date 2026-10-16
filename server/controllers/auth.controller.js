import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import {
    generateAccessToken,
    generateRefreshToken,
} from "../utils/generateTokens.js"

export const handleRegister = async (req, res) => {
    const { firstName, lastName, email, password, gender, jobTitle, role } =
        req.body

    if (!firstName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "First name, email, and password are required",
        })
    }

    try {
        const normalizedEmail = email.toLowerCase().trim()

        // 3. Check for existing user
        const existingUser = await User.findOne({ email: normalizedEmail })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const allowedRoles = ["DEVELOPER"]
        const safeRole = allowedRoles.includes(role) ? role : "DEVELOPER"

        // 6. Create new user
        const newUser = await User.create({
            firstName: firstName.trim(),
            lastName: lastName ? lastName.trim() : "",
            email: normalizedEmail,
            password: hashedPassword,
            gender,
            jobTitle,
            role: safeRole,
        })

        // 7. Return sanitized response
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: newUser._id,
                firstName: newUser.firstName,
                email: newUser.email,
                role: newUser.role,
            },
        })
    } catch (error) {
        console.error("Registration Error:", error)
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleLogin = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required",
        })
    }

    try {
        // 2. Find user
        const user = await User.findOne({ email }).select("+password")

        // 3. Verify password
        const isPasswordValid = user
            ? await bcrypt.compare(password, user.password)
            : false

        if (!user || !isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            })
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            })
        }

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        // 6. Store refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
            },
            accessToken,
        })
    } catch (error) {
        console.error("Login Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleRefresh = async (req, res) => {
    try {
        // 1. Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
            })
        }

        // 2. Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            })
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            })
        }

        // 5. Generate a new access token
        const accessToken = generateAccessToken(user)

        // 6. Send it back
        return res.status(200).json({
            success: true,
            accessToken,
        })
    } catch (error) {
        console.error("Refresh Token Error:", error)

        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token",
        })
    }
}

export const handleChangePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body

    // 1. Validate input
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Current password and new password are required",
        })
    }

    try {
        // 2. Get logged-in user
        const user = await User.findById(req.user.userId).select("+password")

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        // 3. Verify current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password,
        )

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            })
        }

        // 4. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // 5. Update password
        user.password = hashedPassword
        user.mustChangePassword = false

        await user.save()

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        })
    } catch (error) {
        console.error("Change Password Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleLogout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        })
    } catch (error) {
        console.error("Logout Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export const handleMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                jobTitle: user.jobTitle,
                isActive: user.isActive,
                mustChangePassword: user.mustChangePassword,
            },
        })
    } catch (error) {
        console.error("Get Me Error:", error)

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred",
        })
    }
}

export default {
    handleRegister,
    handleLogin,
    handleRefresh,
    handleLogout,
    handleMe,
    handleChangePassword,
}
