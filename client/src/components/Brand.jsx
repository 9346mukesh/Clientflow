import { Link } from "react-router-dom"

import { LogoMark } from "./icons.jsx"

// The wordmark doubles as the link home from every page.
const Brand = ({ to = "/", showName = true, className = "" }) => (
    <Link
        to={to}
        aria-label="ClientFlow — go to dashboard"
        className={`inline-flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-70 ${className}`}
    >
        <LogoMark className="h-8 w-8 text-ink" />
        {showName ? (
            <span className="font-display text-sm font-semibold tracking-tight text-ink">
                ClientFlow
            </span>
        ) : null}
    </Link>
)

export default Brand
