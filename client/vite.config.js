import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// The dev server proxies the API and the socket handshake to the backend, so
// the browser talks to a single origin and the HttpOnly refresh cookie stays
// first-party (no CORS or SameSite surprises in development).
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:5001",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:5001",
                changeOrigin: true,
                ws: true,
            },
        },
    },
})
