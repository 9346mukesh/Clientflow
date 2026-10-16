import { useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"

import NotificationBell from "./NotificationBell.jsx"
import SocketBridge from "../sockets/SocketBridge.jsx"
import Brand from "./Brand.jsx"
import Footer from "./Footer.jsx"
import SiteSearch, { SearchTrigger } from "./SiteSearch.jsx"
import ThemeToggle from "../features/theme/ThemeToggle.jsx"
import { logoutUser } from "../features/auth/authSlice.js"
import { fullName } from "../lib/format.js"
import { ROLE_LABELS } from "../lib/constants.js"
import { Avatar, IconButton } from "./ui.jsx"
import {
    IconActivity,
    IconClients,
    IconClose,
    IconDashboard,
    IconMenu,
    IconProjects,
    IconTasks,
    IconUsers,
} from "./icons.jsx"

// Navigation is derived from the role, so nothing unreachable is ever shown.
const NAV_BY_ROLE = {
    ADMIN: [
        { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
        { to: "/projects", label: "Projects", icon: IconProjects },
        { to: "/clients", label: "Clients", icon: IconClients },
        { to: "/users", label: "Users", icon: IconUsers },
        { to: "/activity", label: "Activity", icon: IconActivity },
    ],
    PROJECT_MANAGER: [
        { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
        { to: "/projects", label: "Projects", icon: IconProjects },
        { to: "/activity", label: "Activity", icon: IconActivity },
    ],
    DEVELOPER: [
        { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
        { to: "/tasks", label: "My Tasks", icon: IconTasks },
    ],
}

// A 2px graphite marker on the left edge marks the current page.
const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg border-l-2 py-2 pl-2.5 pr-3 text-sm transition-colors ${
        isActive
            ? "border-ink bg-surface-2 font-semibold text-ink"
            : "border-transparent font-medium text-muted hover:bg-surface-2 hover:text-ink"
    }`

const NavItems = ({ items, onNavigate }) => (
    <>
        {items.map((item) => {
            const Icon = item.icon
            return (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={linkClass}
                >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                </NavLink>
            )
        })}
    </>
)

const AppLayout = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.auth.user)
    const onlineCount = useSelector((state) => state.presence.onlineCount)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    const menuRef = useRef(null)
    const drawerRef = useRef(null)

    const nav = NAV_BY_ROLE[user?.role] || []

    // Close the account menu on an outside click.
    useEffect(() => {
        const onClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", onClick)
        return () => document.removeEventListener("mousedown", onClick)
    }, [])

    // ⌘K / Ctrl-K opens search; Escape closes whatever is open.
    useEffect(() => {
        const onKeyDown = (event) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault()
                setSearchOpen(true)
                return
            }

            if (event.key === "Escape") {
                setMenuOpen(false)
                setDrawerOpen(false)
            }
        }

        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [])

    // Lock the page and move focus into the drawer while it is open.
    useEffect(() => {
        if (!drawerOpen) return undefined

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        drawerRef.current?.querySelector("a, button")?.focus()

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [drawerOpen])

    const onLogout = async () => {
        await dispatch(logoutUser())
        navigate("/login", { replace: true })
    }

    return (
        <div className="flex min-h-screen bg-page">
            <SocketBridge />

            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-action focus:px-3 focus:py-2 focus:text-sm focus:text-on-action"
            >
                Skip to content
            </a>

            {/* Desktop sidebar */}
            <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
                <Brand className="px-2" />

                <div className="mt-6 px-1">
                    <SearchTrigger
                        onClick={() => setSearchOpen(true)}
                        className="w-full"
                    />
                </div>

                <nav className="mt-4 flex flex-1 flex-col gap-0.5">
                    <NavItems items={nav} />
                </nav>

                <p className="px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                    Signed in as {ROLE_LABELS[user?.role] || "user"}
                </p>
            </aside>

            {/* Mobile drawer */}
            {drawerOpen ? (
                <div className="fixed inset-0 z-[65] lg:hidden">
                    <div
                        className="absolute inset-0 bg-neutral-950/50"
                        onMouseDown={() => setDrawerOpen(false)}
                    />
                    <div
                        ref={drawerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Main navigation"
                        className="absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col border-r border-line bg-surface px-3 py-5"
                    >
                        <div className="flex items-center justify-between px-2">
                            <Brand />
                            <IconButton
                                label="Close navigation"
                                onClick={() => setDrawerOpen(false)}
                            >
                                <IconClose className="h-5 w-5" />
                            </IconButton>
                        </div>

                        <nav className="mt-5 flex flex-1 flex-col gap-0.5">
                            <NavItems
                                items={nav}
                                onNavigate={() => setDrawerOpen(false)}
                            />
                        </nav>

                        <p className="px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                            Signed in as {ROLE_LABELS[user?.role] || "user"}
                        </p>
                    </div>
                </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-page/90 px-3 backdrop-blur sm:px-5">
                    <IconButton
                        label="Open navigation"
                        onClick={() => setDrawerOpen(true)}
                        className="lg:hidden"
                    >
                        <IconMenu />
                    </IconButton>

                    <Brand showName={false} className="lg:hidden" />

                    {user?.role === "ADMIN" ? (
                        <span className="ml-1 hidden items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-line sm:inline-flex">
                            <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
                            {onlineCount} online
                        </span>
                    ) : null}

                    <div className="ml-auto flex items-center gap-1">
                        {/* icon-only below sm, full field from sm to lg */}
                        <div className="sm:hidden">
                            <SearchTrigger
                                onClick={() => setSearchOpen(true)}
                                compact
                            />
                        </div>
                        <div className="hidden sm:block lg:hidden">
                            <SearchTrigger
                                onClick={() => setSearchOpen(true)}
                                className="w-52"
                            />
                        </div>

                        <ThemeToggle />
                        <NotificationBell />

                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen((value) => !value)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-2"
                            >
                                <Avatar person={user} />
                                <span className="hidden max-w-[10rem] truncate text-sm text-muted sm:block">
                                    {fullName(user)}
                                </span>
                            </button>

                            {menuOpen ? (
                                <div
                                    role="menu"
                                    className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl"
                                >
                                    <div className="px-3 py-2">
                                        <p className="truncate text-sm font-medium text-ink">
                                            {fullName(user)}
                                        </p>
                                        <p className="truncate text-xs text-faint">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <div className="border-t border-line" />
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate("/change-password")
                                        }}
                                        className="block w-full px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                                    >
                                        Change password
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={onLogout}
                                        className="block w-full px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                                    >
                                        Log out
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                <main
                    id="main-content"
                    className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8"
                >
                    <Outlet />
                </main>

                <Footer />
            </div>

            <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
    )
}

export default AppLayout
