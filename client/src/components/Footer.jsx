import { Link } from "react-router-dom"

import Brand from "./Brand.jsx"
import { IconMail } from "./icons.jsx"
import { SUPPORT_EMAIL } from "../lib/constants.js"

const LEGAL_LINKS = [
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/terms", label: "Terms & Conditions" },
    { to: "/cookies", label: "Cookie Policy" },
]

// Derived once, never hard-coded, so it cannot go stale.
const COPYRIGHT_YEAR = new Date().getFullYear()

const Footer = () => {
    const year = COPYRIGHT_YEAR

    return (
        <footer className="border-t border-line bg-surface">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-xs">
                        <Brand />
                        <p className="mt-3 text-xs leading-relaxed text-muted">
                            A real-time client project dashboard for agencies —
                            clients, projects and tasks with role-based access
                            and a live activity feed.
                        </p>
                    </div>

                    <nav aria-label="Legal" className="text-xs">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                            Legal
                        </p>
                        <ul className="mt-3 space-y-2">
                            {LEGAL_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        className="text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="text-xs">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                            Contact
                        </p>
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="mt-3 inline-flex items-center gap-1.5 text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                        >
                            <IconMail className="h-3.5 w-3.5" />
                            {SUPPORT_EMAIL}
                        </a>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
                    <p>© {year} ClientFlow. All rights reserved.</p>
                    <p>Built for agencies that ship.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
