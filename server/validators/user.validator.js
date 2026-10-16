import { z } from "zod"

const roles = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]

export const createUserSchema = z
    .object({
        firstName: z.string().trim().min(2).max(50),
        lastName: z.string().trim().max(50).optional(),
        email: z.string().trim().toLowerCase().email(),
        // the temporary password an admin hands to a new user
        password: z.string().min(8).max(128),
        role: z.enum(roles),
        jobTitle: z.string().trim().max(100).optional(),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    })
    .strict()

export const updateUserSchema = z
    .object({
        firstName: z.string().trim().min(2).max(50),
        lastName: z.string().trim().max(50),
        jobTitle: z.string().trim().max(100),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]),
        role: z.enum(roles),
        isActive: z.boolean(),
    })
    .partial()
    .strict()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field is required",
    })
