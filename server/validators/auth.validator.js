import { z } from "zod"

const roles = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]

// self-registration: the controller still forces the role to DEVELOPER
export const registerSchema = z
    .object({
        firstName: z.string().trim().min(2).max(50),
        lastName: z.string().trim().max(50).optional(),
        email: z.string().trim().toLowerCase().email(),
        password: z.string().min(8).max(128),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
        jobTitle: z.string().trim().max(100).optional(),
        role: z.enum(roles).optional(),
    })
    .strict()

export const loginSchema = z
    .object({
        email: z.string().trim().toLowerCase().email(),
        password: z.string().min(1),
    })
    .strict()

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(128),
    })
    .strict()
