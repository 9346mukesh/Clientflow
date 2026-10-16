export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

export const PROJECT_STATUSES = [
    "REQUIREMENT_ANALYSIS",
    "DESIGN",
    "DEVELOPMENT",
    "TESTING",
    "DEPLOYMENT",
    "DELIVERED",
]

export const STATUS_LABELS = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
    DONE: "Done",
}

export const PRIORITY_LABELS = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
}

export const PROJECT_STATUS_LABELS = {
    REQUIREMENT_ANALYSIS: "Requirement Analysis",
    DESIGN: "Design",
    DEVELOPMENT: "Development",
    TESTING: "Testing",
    DEPLOYMENT: "Deployment",
    DELIVERED: "Delivered",
}

export const ROLE_LABELS = {
    ADMIN: "Admin",
    PROJECT_MANAGER: "Project Manager",
    DEVELOPER: "Developer",
}

/*
 * Chip styling. Colour is used sparingly: two neutral weights carry the
 * "open" states, amber means "needs attention", green means "finished", and
 * only red marks something dangerous or late.
 */
export const STATUS_STYLES = {
    TODO: "bg-surface-2 text-muted ring-line",
    IN_PROGRESS: "bg-surface text-ink ring-line-strong",
    IN_REVIEW:
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
    DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
}

/*
 * Priority is encoded by weight rather than four competing hues: outline →
 * tinted → amber → red. Scannable, and it never reads as rainbow.
 */
export const PRIORITY_STYLES = {
    LOW: "bg-transparent text-faint ring-line",
    MEDIUM: "bg-surface-2 text-muted ring-line-strong",
    HIGH: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900",
    CRITICAL:
        "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
}

export const PROJECT_STATUS_STYLES = {
    REQUIREMENT_ANALYSIS: "bg-transparent text-faint ring-line",
    DESIGN: "bg-surface-2 text-muted ring-line-strong",
    DEVELOPMENT: "bg-ink text-page ring-ink",
    TESTING:
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
    DEPLOYMENT:
        "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-900",
    DELIVERED:
        "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
}

export const SUPPORT_EMAIL = "support@clientflow.app"
