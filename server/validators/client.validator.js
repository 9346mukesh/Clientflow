import { z } from "zod";

export const createClientSchema = z.object({
    clientName: z.string().trim().min(2).max(100),
    companyName: z.string().trim().min(2).max(150),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().max(20).optional()
}).strict();

export const updateClientSchema = createClientSchema.partial().extend({
    isActive: z.boolean().optional()
}).strict().refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required"
});