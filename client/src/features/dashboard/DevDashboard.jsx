import { useState } from "react"
import { useDispatch } from "react-redux"

import {
    useGetTasksQuery,
    useUpdateTaskStatusMutation,
} from "../tasks/tasksApi.js"
import { useTaskFilters } from "../tasks/useTaskFilters.js"
import TaskTable from "../../components/tasks/TaskTable.jsx"
import TaskDetailModal from "../../components/tasks/TaskDetailModal.jsx"
import TaskFilters from "../../components/TaskFilters.jsx"
import ActivityFeed from "../../components/ActivityFeed.jsx"
import { Card, PageHeader, StatCard, TableSkeleton } from "../../components/ui.jsx"
import { pushToast } from "../ui/uiSlice.js"
import { errorMessage } from "../../app/api/apiSlice.js"
import { STATUS_LABELS } from "../../lib/constants.js"
import { useDocumentMeta } from "../../lib/useDocumentMeta.js"

const DevDashboard = () => {
    useDocumentMeta(
        "My tasks",
        "The tasks assigned to you, sorted by priority and due date.",
    )

    const dispatch = useDispatch()
    const { filters } = useTaskFilters()
    const { data, isLoading } = useGetTasksQuery(filters)
    const [updateStatus] = useUpdateTaskStatusMutation()
    const [openTaskId, setOpenTaskId] = useState(null)

    const tasks = data?.data || []

    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length
    const overdue = tasks.filter((t) => t.isOverdue).length

    const onStatus = async (id, status) => {
        try {
            await updateStatus({ id, status }).unwrap()
            dispatch(
                pushToast({ message: `Task moved to ${STATUS_LABELS[status]}.` }),
            )
        } catch (error) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(error) }),
            )
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Developer · ${String(tasks.length).padStart(2, "0")} tasks`}
                title="My tasks"
                description="Sorted by priority, then due date."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Assigned to me" value={tasks.length} />
                <StatCard label="In progress" value={inProgress} />
                <StatCard
                    label="Overdue"
                    value={overdue}
                    tone={overdue > 0 ? "danger" : "ink"}
                />
            </div>

            <Card>
                <div className="border-b border-line px-4 py-4 sm:px-5">
                    <TaskFilters />
                </div>
                {isLoading ? (
                    <TableSkeleton rows={5} cols={6} />
                ) : (
                    <TaskTable
                        tasks={tasks}
                        showProject
                        canChangeStatus
                        onOpen={setOpenTaskId}
                        onStatus={onStatus}
                    />
                )}
            </Card>

            <ActivityFeed limit={20} title="Activity on my tasks" />

            <TaskDetailModal
                taskId={openTaskId}
                open={Boolean(openTaskId)}
                onClose={() => setOpenTaskId(null)}
            />
        </div>
    )
}

export default DevDashboard
