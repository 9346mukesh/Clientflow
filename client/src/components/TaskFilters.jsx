import { useTaskFilters } from "../features/tasks/useTaskFilters.js"
import {
    TASK_PRIORITIES,
    TASK_STATUSES,
    PRIORITY_LABELS,
    STATUS_LABELS,
} from "../lib/constants.js"
import { Button, Input, Select } from "./ui.jsx"

// Shared filter bar. Values are driven entirely by the URL.
const TaskFilters = ({ projects = [], showProject = false }) => {
    const { filters, setFilter, clear, hasFilters } = useTaskFilters()

    return (
        <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-slate-600">
                Status
                <Select
                    className="mt-1 w-36"
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
            </label>

            <label className="text-xs font-medium text-slate-600">
                Priority
                <Select
                    className="mt-1 w-36"
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
            </label>

            {showProject ? (
                <label className="text-xs font-medium text-slate-600">
                    Project
                    <Select
                        className="mt-1 w-48"
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
                </label>
            ) : null}

            <label className="text-xs font-medium text-slate-600">
                Due from
                <Input
                    type="date"
                    className="mt-1 w-40"
                    value={filters.dueFrom}
                    onChange={(event) =>
                        setFilter("dueFrom", event.target.value)
                    }
                />
            </label>

            <label className="text-xs font-medium text-slate-600">
                Due to
                <Input
                    type="date"
                    className="mt-1 w-40"
                    value={filters.dueTo}
                    onChange={(event) => setFilter("dueTo", event.target.value)}
                />
            </label>

            {hasFilters ? (
                <Button variant="ghost" onClick={clear}>
                    Clear
                </Button>
            ) : null}
        </div>
    )
}

export default TaskFilters
