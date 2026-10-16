import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import requestTimer from "./middlewares/requestTimer.middleware.js"
import connectDb from "./config/connectDb.js"
import userRoutes from "./routes/user.routes.js"
import authRoutes from "./routes/auth.routes.js"
import clientRoutes from "./routes/client.routes.js"
import projectRoutes from "./routes/project.routes.js"
import taskRoutes from "./routes/task.routes.js"
import notificationRoutes from "./routes/notification.routes.js"
import activityRoutes from "./routes/activity.routes.js"

const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}))
//Middleware
app.use(express.json())
app.use(requestTimer)
app.use(cookieParser())

//Database connection
connectDb()

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Clientflow API is running",
    })
})

//Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/clients", clientRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/activity", activityRoutes)

// unknown route: a structured 404, never a raw HTML error page
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    })
})

// the last line of defence: log the error, send a clean message
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err)

    const status = err.status || 500

    res.status(status).json({
        success: false,
        message: status === 500 ? "An internal server error occurred" : err.message,
    })
})

export default app
