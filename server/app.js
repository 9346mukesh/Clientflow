import express from "express"
import connectDb from "./config/connectDb.js"
import User from "./models/user.model.js"
import userRoutes from "./routes/user.routes.js"

const app = express()
app.use(express.json())

//Database connection
connectDb()

app.get("/", (req, res) =>{
    res.status(200).json({
        success: true,
        message: "Clientflow API is running"
    })
})

//middleware


//Routes
app.use("/api/users", userRoutes)


export default app