import { useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"

import NotificationBell from "./NotificationBell.jsx"
import SocketBridge from "../sockets/SocketBridge.jsx"
import { logoutUser } from "../features/auth/authSlice.js"
import { fullName } from "../lib/format.js"
import { ROLE_LABELS } from "../lib/constants.js"
import { Avatar } from "./ui.jsx"

const NAV_BY_ROLE = {
    ADMIN: [
        { to: "/", label: "Dashboard", icon: "📊", end: true },
        { to: "/projects", label: "Projects", icon: "🗂️" },
        { to: "/clients", label: "Clients", icon: "🏢" },
        { to: "/users", label: "Users", icon: "👥" },
        { to: "/activity", label: "Activity", icon: "📡" },
    ],
    PROJECT_MANAGER: [
        { to: "/", label: "Dashboard", icon: "📊", end: true },
        { to: "/projects", label: "Projects", icon: "🗂️" },
        { to: "/activity", label: "Activity", icon: "📡" },
    ],
    DEVELOPER: [
        { to: "/", label: "Dashboard", icon: "📊", end: true },
        { to: "/tasks", label: "My Tasks", icon: "✅" },
    ],
}

const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive
            ? "bg-brand-600 text-white"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`

const AppLayout = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.auth.user)
    const onlineCount = useSelector((state) => state.presence.onlineCount)

    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    const nav = NAV_BY_ROLE[user?.role] || []

    useEffect(() => {
        const onClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", onClick)
        return () => document.removeEventListener("mousedown", onClick)
    }, [])

    const onLogout = async () => {
        await dispatch(logoutUser())
        navigate("/login", { replace: true })
    }

    return (
        <div className="flex min-h-screen">
            <SocketBridge />

            <aside className="flex w-60 shrink-0 flex-col bg-ink-950 px-3 py-5">
                <div className="mb-6 flex items-center gap-2 px-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                        CF
                    </span>
                    <span className="text-sm font-semibold text-white">
                        ClientFlow
                    </span>
                </div>

                <nav className="flex flex-1 flex-col gap-1">
                    {nav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={linkClass}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <p className="px-2 text-[11px] text-slate-500">
                    Signed in as {ROLE_LABELS[user?.role] || "user"}
                </p>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
                    <div className="flex items-center gap-3">
                        {user?.role === "ADMIN" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {onlineCount} online
                            </span>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                        <NotificationBell />

                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen((value) => !value)}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
                            >
                                <Avatar person={user} />
                                <span className="hidden text-sm text-slate-700 sm:block">
                                    {fullName(user)}
                                </span>
                            </button>

                            {menuOpen ? (
                                <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                                    <div className="px-3 py-2">
                                        <p className="truncate text-sm font-medium text-slate-800">
                                            {fullName(user)}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <div className="border-t border-slate-100" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate("/change-password")
                                        }}
                                        className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        Change password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onLogout}
                                        className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                    >
                                        Log out
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                <main className="min-w-0 flex-1 overflow-y-auto p-5">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AppLayout
