import { DueDate, PriorityBadge, StatusBadge } from "../badges.jsx"
import { STATUS_LABELS, TASK_STATUSES } from "../../lib/constants.js"
import { fullName } from "../../lib/format.js"
import { Avatar, EmptyState, Select } from "../ui.jsx"

// One status control, shared by the table row and the mobile card.
const StatusSelect = ({ task, onStatus, className = "" }) => (
    <Select
        className={className}
        value={task.status}
        aria-label={`Status for task #${task.taskNumber}`}
        onChange={(event) => onStatus?.(task._id, event.target.value)}
    >
        {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
                {STATUS_LABELS[status]}
            </option>
        ))}
    </Select>
)

const TaskTable = ({
    tasks,
    onOpen,
    onStatus,
    canChangeStatus = false,
    showProject = false,
}) => {
    if (!tasks || tasks.length === 0) {
        return (
            <EmptyState
                title="No tasks found"
                hint="Try clearing the filters, or create a task from a project."
            />
        )
    }

    return (
        <>
            {/* Table from md up */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                            <th scope="col" className="px-4 py-2.5 font-medium">
                                Task
                            </th>
                            {showProject ? (
                                <th
                                    scope="col"
                                    className="px-4 py-2.5 font-medium"
                                >
                                    Project
                                </th>
                            ) : null}
                            <th scope="col" className="px-4 py-2.5 font-medium">
                                Assignee
                            </th>
                            <th scope="col" className="px-4 py-2.5 font-medium">
                                Priority
                            </th>
                            <th scope="col" className="px-4 py-2.5 font-medium">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-2.5 font-medium">
                                Due
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr
                                key={task._id}
                                className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
                            >
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => onOpen?.(task._id)}
                                        className="text-left"
                                    >
                                        <span className="block font-medium text-ink">
                                            <span className="font-mono text-xs text-faint">
                                                #{task.taskNumber}
                                            </span>{" "}
                                            {task.title}
                                        </span>
                                        {task.isOverdue ? (
                                            <span className="text-xs font-medium text-danger">
                                                Overdue
                                            </span>
                                        ) : null}
                                    </button>
                                </td>

                                {showProject ? (
                                    <td className="px-4 py-3 text-muted">
                                        {task.project?.projectTitle || "—"}
                                    </td>
                                ) : null}

                                <td className="px-4 py-3">
                                    <span className="flex items-center gap-2 text-muted">
                                        <Avatar person={task.assignedTo} />
                                        {fullName(task.assignedTo)}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <PriorityBadge priority={task.priority} />
                                </td>

                                <td className="w-44 px-4 py-3">
                                    {canChangeStatus ? (
                                        // The control is w-full, so the cell sets
                                        // the width — "In Progress" needs the room.
                                        <StatusSelect
                                            task={task}
                                            onStatus={onStatus}
                                        />
                                    ) : (
                                        <StatusBadge status={task.status} />
                                    )}
                                </td>

                                <td className="px-4 py-3 text-muted">
                                    <DueDate
                                        date={task.dueDate}
                                        status={task.status}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Cards below md — no sideways scrolling on a phone */}
            <ul className="divide-y divide-line md:hidden">
                {tasks.map((task) => (
                    <li key={task._id} className="px-4 py-4">
                        <button
                            type="button"
                            onClick={() => onOpen?.(task._id)}
                            className="block w-full text-left"
                        >
                            <span className="font-mono text-xs text-faint">
                                #{task.taskNumber}
                            </span>
                            <span className="mt-0.5 block font-medium text-ink">
                                {task.title}
                            </span>
                            {showProject && task.project?.projectTitle ? (
                                <span className="mt-0.5 block text-xs text-faint">
                                    {task.project.projectTitle}
                                </span>
                            ) : null}
                        </button>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                            {task.isOverdue ? (
                                <span className="text-xs font-medium text-danger">
                                    Overdue
                                </span>
                            ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                            <span className="inline-flex items-center gap-2">
                                <Avatar person={task.assignedTo} />
                                {fullName(task.assignedTo)}
                            </span>
                            <DueDate
                                date={task.dueDate}
                                status={task.status}
                            />
                        </div>

                        {canChangeStatus ? (
                            <StatusSelect
                                task={task}
                                onStatus={onStatus}
                                className="mt-3"
                            />
                        ) : null}
                    </li>
                ))}
            </ul>
        </>
    )
}

export default TaskTable
