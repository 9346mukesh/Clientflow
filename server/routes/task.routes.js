import express from "express"
import {
    handleGetTasks,
    handleGetTaskById,
    handleUpdateTask,
    handleGetTaskActivity,
    handleDeleteTask,
    handleUpdateTaskStatus,
} from "../controllers/task.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
import authorize from "../middlewares/authorize.middleware.js"
import validate from "../middlewares/validate.middleware.js"
import {
    updateTaskSchema,
    updateTaskStatusSchema,
} from "../validators/task.validator.js"

const router = express.Router()

router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
    handleGetTasks,
)
router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
    handleGetTaskById,
)
router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    validate(updateTaskSchema),
    handleUpdateTask,
)
router.get(
    "/:id/activity",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
    handleGetTaskActivity,
)
router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    handleDeleteTask,
)
router.patch(
    "/:id/status",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
    validate(updateTaskStatusSchema),
    handleUpdateTaskStatus,
)

export default router
