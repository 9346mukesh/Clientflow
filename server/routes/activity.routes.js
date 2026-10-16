import express from "express"
import { handleGetActivity } from "../controllers/activity.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"

const router = express.Router()

// the controller narrows the feed to what the caller's role may see
router.get("/", authMiddleware, handleGetActivity)

export default router
