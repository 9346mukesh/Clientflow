import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

import { Spinner } from "./ui.jsx"

export const Splash = () => (
    <div className="flex min-h-screen items-center justify-center gap-3 bg-ink-950 text-slate-300">
        <Spinner />
        <span className="text-sm">Loading ClientFlow…</span>
    </div>
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
