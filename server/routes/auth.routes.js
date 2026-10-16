import express from "express"
import {
    handleRegister,
    handleLogin,
    handleRefresh,
    handleLogout,
    handleMe,
    handleChangePassword,
} from "../controllers/auth.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"
import validate from "../middlewares/validate.middleware.js"
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
} from "../validators/auth.validator.js"

export const router = express.Router()

router.post("/register", validate(registerSchema), handleRegister)

router.post("/login", validate(loginSchema), handleLogin)
router.post("/refresh", handleRefresh)
router.post("/logout", handleLogout)
router.get("/me", authMiddleware, handleMe)
router.patch(
    "/change-password",
    authMiddleware,
    validate(changePasswordSchema),
    handleChangePassword,
)

export default router
