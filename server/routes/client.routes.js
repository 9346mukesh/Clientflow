import express from "express"
import {
    handleCreateClient,
    handleGetClients,
    handleUpdateClient,
    handleDeleteClient,
} from "../controllers/client.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
import authorize from "../middlewares/authorize.middleware.js"
import validate from "../middlewares/validate.middleware.js"
import {
    createClientSchema,
    updateClientSchema,
} from "../validators/client.validator.js"

const router = express.Router()

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    validate(createClientSchema),
    handleCreateClient,
)
router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "PROJECT_MANAGER"),
    handleGetClients,
)
router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validate(updateClientSchema),
    handleUpdateClient,
)
router.delete("/:id", authMiddleware, authorize("ADMIN"), handleDeleteClient)

export default router
