import express from "express"
import {
    handleCreateProject,
    handleGetProjects,
    handleGetProjectById,
    handleUpdateProject,
    handleDeleteProject,
} from "../controllers/project.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
import authorize from "../middlewares/authorize.middleware.js"
import validate from "../middlewares/validate.middleware.js"
import {
    createProjectSchema,
    updateProjectSchema,
} from "../validators/project.validator.js"
import { handleCreateTask } from "../controllers/task.controller.js"
import { createTaskSchema } from "../validators/task.validator.js"

const router = express.Router()

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    validate(createProjectSchema),
    handleCreateProject,
)
router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    handleGetProjects,
)
router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    handleGetProjectById,
)
router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    validate(updateProjectSchema),
    handleUpdateProject,
)
router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    handleDeleteProject,
)
router.post(
    "/:projectId/tasks",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    validate(createTaskSchema),
    handleCreateTask,
)

export default router
