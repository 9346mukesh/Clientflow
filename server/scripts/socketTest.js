import { io } from "socket.io-client"

const [email, password, mode] = process.argv.slice(2)
const baseUrl = process.env.BASE_URL || "http://localhost:5000"

let token = "junk.token.value"

if (mode !== "bad") {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    token = data.accessToken
}

const socket = io(baseUrl, {
    auth: mode === "none" ? {} : { token }
})

socket.on("connect", () => console.log("connected:", socket.id))
socket.on("connect_error", (err) => {
    console.log("rejected:", err.message)
    process.exit(0)
})
socket.onAny((event, ...args) => console.log("event:", event, JSON.stringify(args)))