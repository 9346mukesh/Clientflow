import { useSelector } from "react-redux"

import { useGetProjectsQuery } from "../projects/projectsApi.js"
import { useGetTasksQuery } from "../tasks/tasksApi.js"
import { selectOnlineCount } from "../presence/presenceSlice.js"
import ActivityFeed from "../../components/ActivityFeed.jsx"
import { Card, CardHeader, Spinner, StatCard } from "../../components/ui.jsx"
import { STATUS_LABELS, TASK_STATUSES } from "../../lib/constants.js"

const AdminDashboard = () => {
    const onlineCount = useSelector(selectOnlineCount)
    const { data: projectData, isLoading: loadingProjects } =
        useGetProjectsQuery()
    const { data: taskData, isLoading: loadingTasks } = useGetTasksQuery()

    const projects = projectData?.data || []
    const tasks = taskData?.data || []

    const overdue = tasks.filter((task) => task.isOverdue).length

    const byStatus = TASK_STATUSES.map((status) => ({
        status,
        count: tasks.filter((task) => task.status === status).length,
    }))

    const maxCount = Math.max(1, ...byStatus.map((row) => row.count))

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">
                    Admin dashboard
                </h1>
                <p className="text-sm text-slate-500">
                    Everything happening across every client and project.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Total projects"
                    value={loadingProjects ? "…" : projects.length}
                    tone="brand"
                />
                <StatCard
                    label="Total tasks"
                    value={loadingTasks ? "…" : tasks.length}
                />
                <StatCard
                    label="Overdue tasks"
                    value={loadingTasks ? "…" : overdue}
                    tone="rose"
                />
                <StatCard
                    label="Online now"
                    value={onlineCount}
                    tone="emerald"
                    hint="Live presence"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Card className="xl:col-span-1">
                    <CardHeader
                        title="Tasks by status"
                        subtitle="Across all projects"
                    />
                    <div className="space-y-3 px-5 py-4">
                        {loadingTasks ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Spinner /> Loading…
                            </div>
                        ) : (
                            byStatus.map((row) => (
                                <div key={row.status}>
                                    <div className="mb-1 flex items-center justify-between text-xs">
                                        <span className="text-slate-600">
                                            {STATUS_LABELS[row.status]}
                                        </span>
                                        <span className="font-medium text-slate-800">
                                            {row.count}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-brand-500"
                                            style={{
                                                width: `${(row.count / maxCount) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <div className="xl:col-span-2">
                    <ActivityFeed
                        limit={20}
                        title="Global activity"
                        subtitle="Every change, newest first"
                    />
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
