import "dotenv/config"
import http from "http"
import app from "./app.js"
import { initSocket } from "./sockets/socket.js"
import { startOverdueJob } from "./jobs/overdue.job.js"

const PORT = process.env.PORT || 5000

const server = http.createServer(app)
initSocket(server)

// the scheduler only needs the http server running for its socket emits
startOverdueJob()

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
