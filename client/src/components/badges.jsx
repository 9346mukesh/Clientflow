import { Badge } from "./ui.jsx"
import {
    PRIORITY_LABELS,
    PRIORITY_STYLES,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_STYLES,
    STATUS_LABELS,
    STATUS_STYLES,
} from "../lib/constants.js"
import { formatDate, isPast } from "../lib/format.js"

export const StatusBadge = ({ status }) => (
    <Badge className={STATUS_STYLES[status] || ""}>
        {STATUS_LABELS[status] || status}
    </Badge>
)

export const PriorityBadge = ({ priority }) => (
    <Badge className={PRIORITY_STYLES[priority] || ""}>
        {PRIORITY_LABELS[priority] || priority}
    </Badge>
)

export const ProjectStatusBadge = ({ status }) => (
    <Badge className={PROJECT_STATUS_STYLES[status] || ""}>
        {PROJECT_STATUS_LABELS[status] || status}
    </Badge>
)

// A due date, called out when the task is late and not finished.
export const DueDate = ({ date, status }) => {
    const late = status !== "DONE" && isPast(date)

    return (
        <span className={late ? "font-medium text-danger" : "text-muted"}>
            {/* Keep the date itself on one line; the "overdue" suffix may wrap. */}
            <span className="whitespace-nowrap">{formatDate(date)}</span>
            {late ? " · overdue" : ""}
        </span>
    )
}
