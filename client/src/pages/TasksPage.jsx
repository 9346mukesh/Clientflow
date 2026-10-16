import { useState } from "react"
import { useDispatch } from "react-redux"
import { useSearchParams } from "react-router-dom"

import {
    useGetTasksQuery,
    useUpdateTaskStatusMutation,
} from "../features/tasks/tasksApi.js"
import { useTaskFilters } from "../features/tasks/useTaskFilters.js"
import TaskTable from "../components/tasks/TaskTable.jsx"
import TaskDetailModal from "../components/tasks/TaskDetailModal.jsx"
import TaskFilters from "../components/TaskFilters.jsx"
import { Card, PageHeader, TableSkeleton } from "../components/ui.jsx"
import { pushToast } from "../features/ui/uiSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import { STATUS_LABELS } from "../lib/constants.js"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"

const TasksPage = () => {
    useDocumentMeta(
        "Tasks",
        "Filter every task you can see by status, priority and due date.",
    )

    const dispatch = useDispatch()
    const { filters } = useTaskFilters()
    const { data, isLoading } = useGetTasksQuery(filters)
    const [updateStatus] = useUpdateTaskStatusMutation()

    const [params, setParams] = useSearchParams()

    // Search results deep-link straight to a task via ?task=<id>.
    const [openTaskId, setOpenTaskId] = useState(() => params.get("task"))

    const tasks = data?.data || []

    const closeTask = () => {
        setOpenTaskId(null)

        // drop the deep-link param but keep the filters intact
        const next = new URLSearchParams(params)
        next.delete("task")
        setParams(next, { replace: true })
    }

    const onStatus = async (id, status) => {
        try {
            await updateStatus({ id, status }).unwrap()
            dispatch(
                pushToast({ message: `Task moved to ${STATUS_LABELS[status]}.` }),
            )
        } catch (error) {
            dispatch(pushToast({ tone: "error", message: errorMessage(error) }))
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Tasks · ${String(tasks.length).padStart(2, "0")} shown`}
                title="Tasks"
                description="Filter by status, priority and due date. The URL keeps your filters."
            />

            <Card>
                <div className="border-b border-line px-4 py-4 sm:px-5">
                    <TaskFilters />
                </div>
                {isLoading ? (
                    <TableSkeleton rows={6} cols={6} />
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

            <TaskDetailModal
                taskId={openTaskId}
                open={Boolean(openTaskId)}
                onClose={closeTask}
            />
        </div>
    )
}

export default TasksPage
