import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

import { LogoMark } from "./icons.jsx"
import { Spinner } from "./ui.jsx"

// A calm, branded first-paint state — never a blank white screen. It stands in
// for the page, so it carries the main landmark the shell would otherwise have.
export const Splash = () => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page">
        <LogoMark className="h-10 w-10 text-ink" />
        <div className="flex items-center gap-2 text-muted">
            <Spinner />
            <span className="text-sm">Loading ClientFlow…</span>
        </div>
    </main>
)

// Gate a route on being signed in, and optionally on holding one of `roles`.
export const ProtectedRoute = ({ roles, children }) => {
    const status = useSelector((state) => state.auth.status)
    const token = useSelector((state) => state.auth.accessToken)
    const user = useSelector((state) => state.auth.user)
    const location = useLocation()

    if (status === "loading") return <Splash />

    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // a user issued a temporary password must change it before anything else
    if (user.mustChangePassword && location.pathname !== "/change-password") {
        return <Navigate to="/change-password" replace />
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />
    }

    return children
}

// Render children only for the given roles (used for buttons and panels).
export const RoleGate = ({ roles, children, fallback = null }) => {
    const role = useSelector((state) => state.auth.user?.role)
    if (!roles.includes(role)) return fallback
    return children
}
