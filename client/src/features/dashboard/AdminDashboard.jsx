import { useSelector } from "react-redux"

import { useGetProjectsQuery } from "../projects/projectsApi.js"
import { useGetTasksQuery } from "../tasks/tasksApi.js"
import { selectOnlineCount } from "../presence/presenceSlice.js"
import ActivityFeed from "../../components/ActivityFeed.jsx"
import {
    Card,
    CardHeader,
    PageHeader,
    Skeleton,
    StatCard,
} from "../../components/ui.jsx"
import { STATUS_LABELS, TASK_STATUSES } from "../../lib/constants.js"
import { useDocumentMeta } from "../../lib/useDocumentMeta.js"

const AdminDashboard = () => {
    useDocumentMeta(
        "Admin dashboard",
        "Agency-wide view of every project, task, overdue item and who is online right now.",
    )

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
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Admin · ${String(projects.length).padStart(2, "0")} projects`}
                title="Admin dashboard"
                description="Everything happening across every client and project."
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Total projects"
                    value={loadingProjects ? "—" : projects.length}
                />
                <StatCard
                    label="Total tasks"
                    value={loadingTasks ? "—" : tasks.length}
                />
                <StatCard
                    label="Overdue tasks"
                    value={loadingTasks ? "—" : overdue}
                    tone={overdue > 0 ? "danger" : "ink"}
                    hint={overdue > 0 ? "Needs attention" : "Nothing late"}
                />
                <StatCard
                    label="Online now"
                    value={onlineCount}
                    tone="success"
                    hint="Live presence"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Card className="xl:col-span-1">
                    <CardHeader
                        title="Tasks by status"
                        subtitle="Across all projects"
                    />
                    <div className="space-y-3.5 px-5 py-4">
                        {loadingTasks ? (
                            <div className="space-y-3.5">
                                {byStatus.map((row) => (
                                    <div key={row.status}>
                                        <Skeleton className="h-3 w-1/3" />
                                        <Skeleton className="mt-2 h-2 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            byStatus.map((row) => (
                                <div key={row.status}>
                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                        <span className="text-muted">
                                            {STATUS_LABELS[row.status]}
                                        </span>
                                        <span className="font-mono tabular-nums text-ink">
                                            {String(row.count).padStart(2, "0")}
                                        </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                                        <div
                                            className="h-full rounded-full bg-ink transition-[width] duration-300"
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
