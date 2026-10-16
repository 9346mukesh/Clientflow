import { useState } from "react"
import { useDispatch } from "react-redux"

import {
    useDeleteTaskMutation,
    useGetTaskActivityQuery,
    useGetTaskQuery,
    useUpdateTaskMutation,
    useUpdateTaskStatusMutation,
} from "../../features/tasks/tasksApi.js"
import { useGetDevelopersQuery } from "../../features/users/usersApi.js"
import { pushToast } from "../../features/ui/uiSlice.js"
import { errorMessage } from "../../app/api/apiSlice.js"
import {
    PRIORITY_LABELS,
    STATUS_LABELS,
    TASK_PRIORITIES,
    TASK_STATUSES,
} from "../../lib/constants.js"
import {
    activityText,
    fullName,
    relativeTime,
    toDateInput,
} from "../../lib/format.js"
import { PriorityBadge } from "../badges.jsx"
import {
    Avatar,
    Button,
    ConfirmDialog,
    ErrorNote,
    Field,
    Input,
    Modal,
    Select,
    Skeleton,
    Textarea,
} from "../ui.jsx"

// The edit form is mounted only when the user opts in, so it can seed itself
// from the loaded task in a useState initializer — no syncing effect needed.
const TaskEditForm = ({ task, developers, onSaved, onCancel }) => {
    const dispatch = useDispatch()
    const [updateTask, { isLoading, error }] = useUpdateTaskMutation()

    const [form, setForm] = useState(() => ({
        title: task.title,
        description: task.description || "",
        assignedTo: task.assignedTo?._id || "",
        priority: task.priority,
        dueDate: toDateInput(task.dueDate),
    }))
    const [fieldErrors, setFieldErrors] = useState({})

    const onChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setFieldErrors((current) => ({ ...current, [name]: undefined }))
    }

    const save = async () => {
        const errors = {}
        if (!form.title.trim()) errors.title = "Give the task a title."
        if (!form.dueDate) errors.dueDate = "Set a due date."

        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) return

        try {
            await updateTask({ id: task._id, ...form }).unwrap()
            dispatch(pushToast({ message: "Task updated." }))
            onSaved()
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    return (
        <div className="space-y-4">
            <Field label="Title" required error={fieldErrors.title}>
                <Input
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    invalid={Boolean(fieldErrors.title)}
                />
            </Field>

            <Field label="Description">
                <Textarea
                    name="description"
                    value={form.description}
                    onChange={onChange}
                />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <Field label="Due date" required error={fieldErrors.dueDate}>
                <Input
                    name="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={onChange}
                    invalid={Boolean(fieldErrors.dueDate)}
                />
            </Field>

            <ErrorNote>{error ? errorMessage(error) : null}</ErrorNote>

            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={save} loading={isLoading}>
                    {isLoading ? "Saving…" : "Save changes"}
                </Button>
            </div>
        </div>
    )
}

const TaskDetailModal = ({ taskId, open, onClose, canEdit = false }) => {
    const dispatch = useDispatch()

    const { data, isLoading } = useGetTaskQuery(taskId, { skip: !taskId })
    const { data: activityData } = useGetTaskActivityQuery(
        { id: taskId },
        { skip: !taskId },
    )
    const { data: devData } = useGetDevelopersQuery(undefined, {
        skip: !open || !canEdit,
    })

    const [updateStatus] = useUpdateTaskStatusMutation()
    const [deleteTask, { isLoading: deleting }] = useDeleteTaskMutation()

    const [editing, setEditing] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const task = data?.data
    const developers = devData?.data || []
    const logs = activityData?.data || []

    const close = () => {
        setEditing(false)
        setConfirmOpen(false)
        onClose()
    }

    const onStatus = async (status) => {
        try {
            await updateStatus({ id: taskId, status }).unwrap()
            dispatch(
                pushToast({ message: `Task moved to ${STATUS_LABELS[status]}.` }),
            )
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    const onDelete = async () => {
        try {
            await deleteTask(taskId).unwrap()
            dispatch(pushToast({ message: "Task deleted." }))
            close()
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    const footer =
        canEdit && task && !editing ? (
            <>
                <Button
                    variant="dangerGhost"
                    onClick={() => setConfirmOpen(true)}
                    className="mr-auto"
                >
                    Delete task
                </Button>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                    Edit
                </Button>
            </>
        ) : null

    return (
        <>
            <Modal
                open={open}
                onClose={close}
                title={
                    task
                        ? `Task #${task.taskNumber}`
                        : "Task"
                }
                description={task?.project?.projectTitle || undefined}
                footer={footer}
                dismissOnEscape={!confirmOpen}
            >
                {isLoading || !task ? (
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ) : editing ? (
                    <TaskEditForm
                        task={task}
                        developers={developers}
                        onSaved={() => setEditing(false)}
                        onCancel={() => setEditing(false)}
                    />
                ) : (
                    <div className="space-y-5">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <PriorityBadge priority={task.priority} />
                                {task.isOverdue ? (
                                    <span className="text-xs font-medium text-danger">
                                        Overdue
                                    </span>
                                ) : null}
                            </div>
                            <h3 className="mt-2 font-display text-base font-semibold tracking-tight text-ink">
                                {task.title}
                            </h3>
                            {task.description ? (
                                <p className="mt-1 text-sm leading-relaxed text-muted">
                                    {task.description}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                                    Assignee
                                </p>
                                <p className="mt-1.5 flex items-center gap-2 text-muted">
                                    <Avatar person={task.assignedTo} />
                                    {fullName(task.assignedTo)}
                                </p>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                                    Due date
                                </p>
                                <p
                                    className={`mt-1.5 ${
                                        task.isOverdue
                                            ? "font-medium text-danger"
                                            : "text-muted"
                                    }`}
                                >
                                    {toDateInput(task.dueDate) || "—"}
                                </p>
                            </div>
                        </div>

                        <Field label="Status">
                            <Select
                                value={task.status}
                                aria-label="Task status"
                                onChange={(event) =>
                                    onStatus(event.target.value)
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
                            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                                Activity log
                            </p>
                            {logs.length === 0 ? (
                                <p className="text-xs text-muted">
                                    No activity recorded yet.
                                </p>
                            ) : (
                                <ul className="space-y-2.5">
                                    {logs.map((log) => (
                                        <li
                                            key={log._id}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong"
                                            />
                                            <span className="text-muted">
                                                {activityText(log)}
                                                <span className="text-faint">
                                                    {" · "}
                                                    <span className="font-mono text-[11px]">
                                                        {relativeTime(
                                                            log.createdAt,
                                                        )}
                                                    </span>
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

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={onDelete}
                loading={deleting}
                title="Delete this task?"
                description={
                    task
                        ? `Task #${task.taskNumber} · ${task.title}`
                        : undefined
                }
                confirmLabel="Delete task"
            />
        </>
    )
}

export default TaskDetailModal
