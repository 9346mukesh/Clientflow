import { useState } from "react"

import {
    useGetTasksQuery,
    useUpdateTaskStatusMutation,
} from "../tasks/tasksApi.js"
import { useTaskFilters } from "../tasks/useTaskFilters.js"
import TaskTable from "../../components/tasks/TaskTable.jsx"
import TaskDetailModal from "../../components/tasks/TaskDetailModal.jsx"
import TaskFilters from "../../components/TaskFilters.jsx"
import ActivityFeed from "../../components/ActivityFeed.jsx"
import { Card, StatCard } from "../../components/ui.jsx"

const DevDashboard = () => {
    const { filters } = useTaskFilters()
    const { data, isLoading } = useGetTasksQuery(filters)
    const [updateStatus] = useUpdateTaskStatusMutation()
    const [openTaskId, setOpenTaskId] = useState(null)

    const tasks = data?.data || []

    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length
    const overdue = tasks.filter((t) => t.isOverdue).length

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">
                    My tasks
                </h1>
                <p className="text-sm text-slate-500">
                    Sorted by priority, then due date.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Assigned to me" value={tasks.length} tone="brand" />
                <StatCard label="In progress" value={inProgress} />
                <StatCard label="Overdue" value={overdue} tone="rose" />
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
                        onStatus={(id, status) =>
                            updateStatus({ id, status })
                        }
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
