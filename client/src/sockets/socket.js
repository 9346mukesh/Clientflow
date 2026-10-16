import { io } from "socket.io-client"

// A single socket for the whole app, owned here rather than by a component so
// that re-renders and React StrictMode's double-mount never tear down or
// duplicate the connection.
let socket = null

export const connectSocket = (token) => {
    // Reuse the existing connection when the token is unchanged — including
    // while it is still connecting. (socket.disconnected is true during the
    // handshake, so testing it here would tear down a socket that is mid-connect
    // on React StrictMode's second effect run.)
    if (socket && socket.auth?.token === token) {
        return socket
    }

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
