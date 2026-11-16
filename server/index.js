import "dotenv/config"
import http from "http"
import app from "./app.js"
import connectDb from "./config/connectDb.js"
import { initSocket } from "./sockets/socket.js"
import { startOverdueJob } from "./jobs/overdue.job.js"

const PORT = process.env.PORT || 5000

const startServer = async () => {
    // Connect to MongoDB before accepting requests
    await connectDb()

    const server = http.createServer(app)

    initSocket(server)

    // Start background scheduler
    startOverdueJob()

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`)
    })
}

startServer()