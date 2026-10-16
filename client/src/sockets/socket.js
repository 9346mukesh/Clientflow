import { io } from "socket.io-client"

// A single socket for the whole app. It lives here instead of in a component so
// that re-renders never create a second connection.
let socket = null

export const connectSocket = (token) => {
    // a new access token (e.g. after a refresh) needs a fresh handshake
    if (socket) {
        socket.disconnect()
        socket = null
    }

    // connect to this origin; the Vite dev proxy forwards the handshake
    socket = io("/", {
        auth: { token },
        transports: ["websocket", "polling"],
    })

    return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}
