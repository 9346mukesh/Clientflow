import { PRIORITY_LABELS, STATUS_LABELS } from "./constants.js"

// "just now", "2 mins ago", "3 hrs ago", "5 days ago"
export const relativeTime = (value) => {
    if (!value) return ""

    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)

    if (seconds < 45) return "just now"

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`

    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`

    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`

    return `${Math.floor(months / 12)} yr ago`
}

// "Oct 20, 2026"
export const formatDate = (value) => {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

// the yyyy-mm-dd a date input expects
export const toDateInput = (value) => {
    if (!value) return ""
    const date = new Date(value)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${date.getFullYear()}-${month}-${day}`
}

export const fullName = (person) =>
    [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown"

export const initials = (person) => {
    const first = person?.firstName?.[0] || ""
    const last = person?.lastName?.[0] || ""
    return (first + last).toUpperCase() || "?"
}

export const isPast = (value) =>
    value ? new Date(value).getTime() < Date.now() : false

// Turn one activity row into the sentence the feed shows, e.g.
// "Ravi moved Task #12 from In Progress -> In Review"
export const activityText = (row) => {
    const who = row?.performedBy ? fullName(row.performedBy) : "Someone"
    const task = row?.task?.taskNumber ? `Task #${row.task.taskNumber}` : "a task"

    switch (row?.action) {
        case "TASK_CREATED":
            return `${who} created ${task}`
        case "TASK_ASSIGNED":
            return `${who} assigned ${task} to a developer`
        case "STATUS_CHANGE":
            return `${who} moved ${task} from ${STATUS_LABELS[row.fromValue] || row.fromValue} → ${STATUS_LABELS[row.toValue] || row.toValue}`
        case "PRIORITY_CHANGE":
            return `${who} set ${task} to ${PRIORITY_LABELS[row.toValue] || row.toValue} priority`
        case "MARKED_OVERDUE":
            return `${task} was flagged overdue`
        default:
            return `${who} updated ${task}`
    }
}
