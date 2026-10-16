import { PriorityBadge, StatusBadge } from "../badges.jsx"
import { TASK_STATUSES, STATUS_LABELS } from "../../lib/constants.js"
import { fullName } from "../../lib/format.js"
import { Avatar, EmptyState, Select } from "../ui.jsx"
import { DueDate } from "../badges.jsx"

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
                hint="Try clearing the filters or creating a task."
            />
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-2 font-medium">Task</th>
                        {showProject ? (
                            <th className="px-4 py-2 font-medium">Project</th>
                        ) : null}
                        <th className="px-4 py-2 font-medium">Assignee</th>
                        <th className="px-4 py-2 font-medium">Priority</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Due</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task) => (
                        <tr
                            key={task._id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                        >
                            <td className="px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() => onOpen?.(task._id)}
                                    className="text-left"
                                >
                                    <span className="block font-medium text-slate-800 hover:text-brand-600">
                                        #{task.taskNumber} {task.title}
                                    </span>
                                    {task.isOverdue ? (
                                        <span className="text-xs text-rose-600">
                                            Overdue
                                        </span>
                                    ) : null}
                                </button>
                            </td>

                            {showProject ? (
                                <td className="px-4 py-3 text-slate-600">
                                    {task.project?.projectTitle || "—"}
                                </td>
                            ) : null}

                            <td className="px-4 py-3">
                                <span className="flex items-center gap-2 text-slate-600">
                                    <Avatar person={task.assignedTo} />
                                    {fullName(task.assignedTo)}
                                </span>
                            </td>

                            <td className="px-4 py-3">
                                <PriorityBadge priority={task.priority} />
                            </td>

                            <td className="px-4 py-3">
                                {canChangeStatus ? (
                                    <Select
                                        className="w-36"
                                        value={task.status}
                                        onChange={(event) =>
                                            onStatus?.(
                                                task._id,
                                                event.target.value,
                                            )
                                        }
                                    >
                                        {TASK_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {STATUS_LABELS[status]}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <StatusBadge status={task.status} />
                                )}
                            </td>

                            <td className="px-4 py-3">
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
    )
}

export default TaskTable
