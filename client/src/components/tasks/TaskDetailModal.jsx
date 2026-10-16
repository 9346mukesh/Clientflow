import { useEffect, useState } from "react"

import {
    useDeleteTaskMutation,
    useGetTaskActivityQuery,
    useGetTaskQuery,
    useUpdateTaskMutation,
    useUpdateTaskStatusMutation,
} from "../../features/tasks/tasksApi.js"
import { useGetDevelopersQuery } from "../../features/users/usersApi.js"
import { errorMessage } from "../../app/api/apiSlice.js"
import {
    PRIORITY_LABELS,
    TASK_PRIORITIES,
    TASK_STATUSES,
    STATUS_LABELS,
} from "../../lib/constants.js"
import { activityText, fullName, relativeTime, toDateInput } from "../../lib/format.js"
import { PriorityBadge } from "../badges.jsx"
import {
    Avatar,
    Button,
    ErrorNote,
    Field,
    Input,
    Modal,
    Select,
    Spinner,
    Textarea,
} from "../ui.jsx"

const TaskDetailModal = ({ taskId, open, onClose, canEdit = false }) => {
    const { data, isLoading } = useGetTaskQuery(taskId, { skip: !taskId })
    const { data: activityData } = useGetTaskActivityQuery(
        { id: taskId },
        { skip: !taskId },
    )
    const { data: devData } = useGetDevelopersQuery(undefined, {
        skip: !open || !canEdit,
    })

    const [updateStatus] = useUpdateTaskStatusMutation()
    const [updateTask, { isLoading: saving, error }] = useUpdateTaskMutation()
    const [deleteTask] = useDeleteTaskMutation()

    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState(null)

    const task = data?.data
    const developers = devData?.data || []
    const logs = activityData?.data || []

    // seed the edit form whenever a different task is opened
    useEffect(() => {
        if (task) {
            setForm({
                title: task.title,
                description: task.description || "",
                assignedTo: task.assignedTo?._id || "",
                priority: task.priority,
                dueDate: toDateInput(task.dueDate),
            })
        }
        setEditing(false)
    }, [task])

    const onChange = (event) =>
        setForm((value) => ({
            ...value,
            [event.target.name]: event.target.value,
        }))

    const save = async () => {
        try {
            await updateTask({ id: taskId, ...form }).unwrap()
            setEditing(false)
        } catch {
            // surfaced below
        }
    }

    const onDelete = async () => {
        await deleteTask(taskId)
        onClose()
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                task
                    ? `Task #${task.taskNumber} · ${task.project?.projectTitle || ""}`
                    : "Task"
            }
            footer={
                canEdit && task ? (
                    editing ? (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={save} disabled={saving}>
                                {saving ? "Saving…" : "Save changes"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="danger"
                                onClick={onDelete}
                                className="mr-auto"
                            >
                                Delete
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setEditing(true)}
                            >
                                Edit
                            </Button>
                        </>
                    )
                ) : null
            }
        >
            {isLoading || !task ? (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                    <Spinner /> Loading task…
                </div>
            ) : editing ? (
                <div className="space-y-4">
                    <Field label="Title">
                        <Input
                            name="title"
                            value={form.title}
                            onChange={onChange}
                        />
                    </Field>
                    <Field label="Description">
                        <Textarea
                            name="description"
                            value={form.description}
                            onChange={onChange}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Assignee">
                            <Select
                                name="assignedTo"
                                value={form.assignedTo}
                                onChange={onChange}
                            >
                                {developers.map((dev) => (
                                    <option key={dev._id} value={dev._id}>
                                        {fullName(dev)}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Priority">
                            <Select
                                name="priority"
                                value={form.priority}
                                onChange={onChange}
                            >
                                {TASK_PRIORITIES.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {PRIORITY_LABELS[priority]}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                    <Field label="Due date">
                        <Input
                            name="dueDate"
                            type="date"
                            value={form.dueDate}
                            onChange={onChange}
                        />
                    </Field>
                    <ErrorNote>{error ? errorMessage(error) : null}</ErrorNote>
                </div>
            ) : (
                <div className="space-y-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <PriorityBadge priority={task.priority} />
                            {task.isOverdue ? (
                                <span className="text-xs font-medium text-rose-600">
                                    Overdue
                                </span>
                            ) : null}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">
                            {task.title}
                        </h3>
                        {task.description ? (
                            <p className="mt-1 text-sm text-slate-600">
                                {task.description}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-slate-400">Assignee</p>
                            <p className="mt-1 flex items-center gap-2 text-slate-700">
                                <Avatar person={task.assignedTo} />
                                {fullName(task.assignedTo)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Due date</p>
                            <p className="mt-1 text-slate-700">
                                {toDateInput(task.dueDate) || "—"}
                            </p>
                        </div>
                    </div>

                    <Field label="Status">
                        <Select
                            value={task.status}
                            onChange={(event) =>
                                updateStatus({
                                    id: taskId,
                                    status: event.target.value,
                                })
                            }
                        >
                            {TASK_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {STATUS_LABELS[status]}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <div>
                        <p className="mb-2 text-xs font-medium text-slate-600">
                            Activity log
                        </p>
                        {logs.length === 0 ? (
                            <p className="text-xs text-slate-400">
                                No activity recorded yet.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {logs.map((log) => (
                                    <li
                                        key={log._id}
                                        className="flex items-start gap-2 text-xs"
                                    >
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                                        <span className="text-slate-600">
                                            {activityText(log)}
                                            <span className="text-slate-400">
                                                {" · "}
                                                {relativeTime(log.createdAt)}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default TaskDetailModal
