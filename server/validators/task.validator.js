import { z } from "zod"

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]

const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid id")

export const createTaskSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000).optional(),
        assignedTo: objectId,
        priority: z.enum(priorities).optional(),
        // a plain date (2026-10-20) or a full ISO timestamp both pass
        dueDate: z.string().trim().min(1),
    })
    .strict()

export const updateTaskSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000),
        assignedTo: objectId,
        priority: z.enum(priorities),
        dueDate: z.string().trim().min(1),
    })
    .partial()
    .strict()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field is required",
    })

export const updateTaskStatusSchema = z
    .object({
        status: z.enum(statuses),
    })
    .strict()
