import express from "express"
import {
    handleCreateUser,
    handleGetUsers,
    handleGetDevelopers,
    handleUpdateUser,
} from "../controllers/user.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
import authorize from "../middlewares/authorize.middleware.js"
import validate from "../middlewares/validate.middleware.js"
import {
    createUserSchema,
    updateUserSchema,
} from "../validators/user.validator.js"

const router = express.Router()

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    validate(createUserSchema),
    handleCreateUser,
)
router.get("/", authMiddleware, authorize("ADMIN"), handleGetUsers)
router.get(
    "/developers",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    handleGetDevelopers,
)
router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validate(updateUserSchema),
    handleUpdateUser,
)
export default router
