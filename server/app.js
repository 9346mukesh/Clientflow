import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import requestTimer from "./middlewares/requestTimer.middleware.js"
import connectDb from "./config/connectDb.js"
import User from "./models/user.model.js"
import userRoutes from "./routes/user.routes.js"
import authRoutes from "./routes/auth.routes.js"
const app = express()

//Middleware
app.use(express.json())
app.use(cors())
app.use(requestTimer)
app.use(cookieParser())

//Database connection
connectDb()


app.get("/", (req, res) =>{
    res.status(200).json({
        success: true,
        message: "Clientflow API is running"
    })
})



//Routes
app.use("/api/users", userRoutes)
app.use("/api/auth", authRoutes)

export default app