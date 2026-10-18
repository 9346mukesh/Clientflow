import { Link } from "react-router-dom"

import { useGetProjectsQuery } from "../projects/projectsApi.js"
import { useGetTasksQuery } from "../tasks/tasksApi.js"
import ActivityFeed from "../../components/ActivityFeed.jsx"
import { DueDate, ProjectStatusBadge } from "../../components/badges.jsx"
import {
    Card,
    CardHeader,
    EmptyState,
    PageHeader,
    Skeleton,
    StatCard,
} from "../../components/ui.jsx"
import { PRIORITY_LABELS, TASK_PRIORITIES } from "../../lib/constants.js"
import { useDocumentMeta } from "../../lib/useDocumentMeta.js"

const inThisWeek = (date) => {
    const target = new Date(date).getTime()
    const now = Date.now()
    return target >= now && target <= now + 7 * 24 * 60 * 60 * 1000
}

const PmDashboard = () => {
    useDocumentMeta(
        "Dashboard",
        "Your projects, priorities and what is due soon in ClientFlow.",
    )

    const { data: projectData, isLoading: loadingProjects } =
        useGetProjectsQuery()
    const { data: taskData, isLoading: loadingTasks } = useGetTasksQuery()

    const projects = projectData?.data || []
    const tasks = taskData?.data || []

    const overdue = tasks.filter((task) => task.isOverdue).length

    const byPriority = TASK_PRIORITIES.map((priority) => ({
        priority,
        count: tasks.filter((task) => task.priority === priority).length,
    }))

    // everything due in the next seven days; the list below shows the first few
    const dueThisWeek = tasks
        .filter((task) => task.status !== "DONE" && inThisWeek(task.dueDate))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

    const upcoming = dueThisWeek.slice(0, 6)

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Manager · ${String(projects.length).padStart(2, "0")} projects`}
                title="My dashboard"
                description="Your projects, priorities and what is due soon."
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="My projects"
                    value={loadingProjects ? "—" : projects.length}
                />
                <StatCard
                    label="Total tasks"
                    value={loadingTasks ? "—" : tasks.length}
                />
                <StatCard
                    label="Overdue"
                    value={loadingTasks ? "—" : overdue}
                    tone={overdue > 0 ? "danger" : "ink"}
                />
                <StatCard
                    label="Due this week"
                    value={loadingTasks ? "—" : dueThisWeek.length}
                    tone="warning"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Card>
                    <CardHeader
                        title="Tasks by priority"
                        subtitle="Across your projects"
                    />
                    <div className="space-y-3 px-5 py-4">
                        {loadingTasks ? (
                            <div className="space-y-3">
                                {byPriority.map((row) => (
                                    <Skeleton key={row.priority} className="h-4 w-full" />
                                ))}
                            </div>
                        ) : (
                            byPriority.map((row) => (
                                <div
                                    key={row.priority}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-muted">
                                        {PRIORITY_LABELS[row.priority]}
                                    </span>
                                    <span className="font-mono tabular-nums text-ink">
                                        {String(row.count).padStart(2, "0")}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card className="xl:col-span-2">
                    <CardHeader
                        title="Upcoming due dates"
                        subtitle={
                            upcoming.length < dueThisWeek.length
                                ? `Next seven days · first ${upcoming.length} of ${dueThisWeek.length}`
                                : "Next seven days"
                        }
                    />
                    {loadingTasks ? (
                        <div className="space-y-3 px-5 py-4">
                            {[0, 1, 2, 3].map((row) => (
                                <Skeleton key={row} className="h-4 w-full" />
                            ))}
                        </div>
                    ) : upcoming.length === 0 ? (
                        <EmptyState
                            title="Nothing due in the next week"
                            hint="Enjoy the calm — or pull work forward."
                        />
                    ) : (
                        <ul className="divide-y divide-line">
                            {upcoming.map((task) => (
                                <li
                                    key={task._id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                                >
                                    <span className="min-w-0 truncate text-muted">
                                        <span className="font-mono text-xs text-faint">
                                            #{task.taskNumber}
                                        </span>{" "}
                                        {task.title}
                                    </span>
                                    <DueDate
                                        date={task.dueDate}
                                        status={task.status}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Card>
                    <CardHeader title="Your projects" />
                    {loadingProjects ? (
                        <div className="space-y-3 px-5 py-4">
                            {[0, 1, 2].map((row) => (
                                <Skeleton key={row} className="h-4 w-full" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <EmptyState
                            title="You do not manage any projects yet"
                            hint="Create one from the Projects page to get started."
                        />
                    ) : (
                        <ul className="divide-y divide-line">
                            {projects.map((project) => (
                                <li key={project._id}>
                                    <Link
                                        to={`/projects/${project._id}`}
                                        className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-surface-2"
                                    >
                                        <span className="min-w-0 truncate text-muted">
                                            {project.projectTitle}
                                        </span>
                                        <ProjectStatusBadge
                                            status={project.status}
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <ActivityFeed limit={20} title="Team activity" />
            </div>
        </div>
    )
}

export default PmDashboard
