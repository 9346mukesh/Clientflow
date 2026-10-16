import { useTaskFilters } from "../features/tasks/useTaskFilters.js"
import {
    PRIORITY_LABELS,
    STATUS_LABELS,
    TASK_PRIORITIES,
    TASK_STATUSES,
} from "../lib/constants.js"
import { Button, Input, Select } from "./ui.jsx"

const LABEL = "text-[11px] font-mono uppercase tracking-[0.14em] text-faint"

const Filter = ({ label, children, className = "" }) => (
    <label className={`block ${className}`}>
        <span className={`mb-1 block ${LABEL}`}>{label}</span>
        {children}
    </label>
)

// Shared filter bar. Values are driven entirely by the URL, so a filtered
// view can be shared or bookmarked.
const TaskFilters = ({ projects = [], showProject = false }) => {
    const { filters, setFilter, clear, hasFilters } = useTaskFilters()

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-end">
            <Filter label="Status">
                <Select
                    value={filters.status}
                    onChange={(event) => setFilter("status", event.target.value)}
                >
                    <option value="">All</option>
                    {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                        </option>
                    ))}
                </Select>
            </Filter>

            <Filter label="Priority">
                <Select
                    value={filters.priority}
                    onChange={(event) =>
                        setFilter("priority", event.target.value)
                    }
                >
                    <option value="">All</option>
                    {TASK_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                            {PRIORITY_LABELS[priority]}
                        </option>
                    ))}
                </Select>
            </Filter>

            {showProject ? (
                <Filter label="Project" className="col-span-2 sm:col-span-1">
                    <Select
                        value={filters.project}
                        onChange={(event) =>
                            setFilter("project", event.target.value)
                        }
                    >
                        <option value="">All</option>
                        {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.projectTitle}
                            </option>
                        ))}
                    </Select>
                </Filter>
            ) : null}

            <Filter label="Due from">
                <Input
                    type="date"
                    value={filters.dueFrom}
                    onChange={(event) =>
                        setFilter("dueFrom", event.target.value)
                    }
                />
            </Filter>

            <Filter label="Due to">
                <Input
                    type="date"
                    value={filters.dueTo}
                    onChange={(event) => setFilter("dueTo", event.target.value)}
                />
            </Filter>

            {hasFilters ? (
                <Button
                    variant="ghost"
                    onClick={clear}
                    className="col-span-2 sm:col-span-1"
                >
                    Clear filters
                </Button>
            ) : null}
        </div>
    )
}

export default TaskFilters
