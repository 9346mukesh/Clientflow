import express from "express"
import { handleRegister, handleLogin, handleRefresh, handleLogout, handleMe, handleChangePassword} from "../controllers/auth.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js";

export const router = express.Router()

router.post("/register", handleRegister)


router.post("/login", handleLogin)
router.post("/refresh", handleRefresh)
router.post("/logout", handleLogout)
router.get("/me", authMiddleware, handleMe)
router.patch("/change-password", authMiddleware,handleChangePassword)

export default router