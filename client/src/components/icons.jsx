// One consistent icon set: 24px grid, 1.6 stroke, currentColor.
// Icons are decorative unless a label is supplied by the caller.

const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
}

export const IconMenu = ({ className = "h-5 w-5" }) => (
    <svg {...base} className={className}>
        <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
)

export const IconClose = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
)

export const IconSearch = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2" />
    </svg>
)

export const IconSun = ({ className = "h-5 w-5" }) => (
    <svg {...base} className={className}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </svg>
)

export const IconMoon = ({ className = "h-5 w-5" }) => (
    <svg {...base} className={className}>
        <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
    </svg>
)

export const IconArrowUp = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M12 19.5V5M6 11l6-6 6 6" />
    </svg>
)

export const IconChevronRight = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M9.5 5.5L16 12l-6.5 6.5" />
    </svg>
)

export const IconChevronLeft = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M14.5 5.5L8 12l6.5 6.5" />
    </svg>
)

export const IconCheck = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className} strokeWidth={2}>
        <path d="M4.5 12.5l5 5 10-11" />
    </svg>
)

export const IconAlert = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className} strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5V13M12 16.3v.2" />
    </svg>
)

export const IconExternal = ({ className = "h-3.5 w-3.5" }) => (
    <svg {...base} className={className}>
        <path d="M14 4.5h5.5V10M19.5 4.5L11 13M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </svg>
)

export const IconMail = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
)

export const IconDashboard = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
)

export const IconProjects = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M12 3.5l8 4.3-8 4.3-8-4.3z" />
        <path d="M4 12.4l8 4.3 8-4.3M4 16.6l8 4.3 8-4.3" />
    </svg>
)

export const IconClients = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M4 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v15.5" />
        <path d="M14 9.5h4.5A1.5 1.5 0 0 1 20 11v9.5M3 20.5h18M7 7.5h3M7 11h3M7 14.5h3M17 13h1M17 16.5h1" />
    </svg>
)

export const IconUsers = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <circle cx="9.5" cy="8.5" r="3.2" />
        <path d="M3.8 19.5a5.7 5.7 0 0 1 11.4 0" />
        <path d="M16 5.6a3.2 3.2 0 0 1 0 6M17.4 14.4a5.7 5.7 0 0 1 3 5.1" />
    </svg>
)

export const IconActivity = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M3 12.5h3.5L9 6.5l3.5 11 2.5-5h6" />
    </svg>
)

export const IconTasks = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
        <path d="M8 12.2l2.7 2.7L16.3 9" />
    </svg>
)

export const IconBell = ({ className = "h-5 w-5" }) => (
    <svg {...base} className={className}>
        <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5z" />
        <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
)

export const IconInbox = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M3.5 12.5 6 5.5h12l2.5 7v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
        <path d="M3.5 12.5h5l1 2h5l1-2h5" />
    </svg>
)

export const IconClock = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
    </svg>
)

export const IconPin = ({ className = "h-4 w-4" }) => (
    <svg {...base} className={className}>
        <path d="M15.5 3.5 20.5 8.5l-3 1-3.5 3.5.5 5-1.5 1.5-4-4-4 4 1.5-1.5.5-5L10.5 9l1-3z" />
    </svg>
)

// The ClientFlow mark: a forward chevron, echoing "flow".
export const LogoMark = ({ className = "h-8 w-8" }) => (
    <svg
        viewBox="0 0 32 32"
        className={className}
        role="img"
        aria-label="ClientFlow"
    >
        <rect width="32" height="32" rx="7" fill="currentColor" />
        <path
            d="M13.5 10.5 19 16l-5.5 5.5"
            fill="none"
            stroke="var(--c-page)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
