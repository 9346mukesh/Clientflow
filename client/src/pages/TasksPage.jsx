import { useState } from "react"

import {
    useGetTasksQuery,
    useUpdateTaskStatusMutation,
} from "../features/tasks/tasksApi.js"
import { useTaskFilters } from "../features/tasks/useTaskFilters.js"
import TaskTable from "../components/tasks/TaskTable.jsx"
import TaskDetailModal from "../components/tasks/TaskDetailModal.jsx"
import TaskFilters from "../components/TaskFilters.jsx"
import { Card } from "../components/ui.jsx"

const TasksPage = () => {
    const { filters } = useTaskFilters()
    const { data, isLoading } = useGetTasksQuery(filters)
    const [updateStatus] = useUpdateTaskStatusMutation()
    const [openTaskId, setOpenTaskId] = useState(null)

    const tasks = data?.data || []

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">
                    Tasks
                </h1>
                <p className="text-sm text-slate-500">
                    Filter by status, priority and due date. The URL keeps your
                    filters.
                </p>
            </div>

            <Card>
                <div className="border-b border-slate-100 px-5 py-4">
                    <TaskFilters />
                </div>
                {isLoading ? (
                    <p className="px-5 py-6 text-sm text-slate-500">
                        Loading tasks…
                    </p>
                ) : (
                    <TaskTable
                        tasks={tasks}
                        showProject
                        canChangeStatus
                        onOpen={setOpenTaskId}
                        onStatus={(id, status) => updateStatus({ id, status })}
                    />
                )}
            </Card>

            <TaskDetailModal
                taskId={openTaskId}
                open={Boolean(openTaskId)}
                onClose={() => setOpenTaskId(null)}
            />
        </div>
    )
}

export default TasksPage
