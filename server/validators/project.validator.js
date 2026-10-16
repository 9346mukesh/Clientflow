import { z } from "zod"

const statuses = [
    "REQUIREMENT_ANALYSIS",
    "DESIGN",
    "DEVELOPMENT",
    "TESTING",
    "DEPLOYMENT",
    "DELIVERED",
]

const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid id")

export const createProjectSchema = z
    .object({
        projectTitle: z.string().trim().min(1).max(150),
        projectDescription: z.string().trim().min(1).max(2000),
        client: objectId,
        // a PM always owns what they create; only an admin's value is used
        projectManager: objectId.optional(),
        status: z.enum(statuses).optional(),
    })
    .strict()

export const updateProjectSchema = z
    .object({
        projectTitle: z.string().trim().min(1).max(150),
        projectDescription: z.string().trim().min(1).max(2000),
        status: z.enum(statuses),
        // reassignment is admin-only, enforced in the controller
        projectManager: objectId,
    })
    .partial()
    .strict()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field is required",
    })
