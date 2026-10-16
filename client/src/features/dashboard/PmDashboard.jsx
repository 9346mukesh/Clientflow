import { Link } from "react-router-dom"

import { useGetProjectsQuery } from "../projects/projectsApi.js"
import { useGetTasksQuery } from "../tasks/tasksApi.js"
import ActivityFeed from "../../components/ActivityFeed.jsx"
import { ProjectStatusBadge } from "../../components/badges.jsx"
import {
    Card,
    CardHeader,
    Spinner,
    StatCard,
} from "../../components/ui.jsx"
import {
    PRIORITY_LABELS,
    TASK_PRIORITIES,
} from "../../lib/constants.js"
import { DueDate } from "../../components/badges.jsx"

const inThisWeek = (date) => {
    const target = new Date(date).getTime()
    const now = Date.now()
    return target >= now && target <= now + 7 * 24 * 60 * 60 * 1000
}

const PmDashboard = () => {
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

    const upcoming = tasks
        .filter(
            (task) => task.status !== "DONE" && inThisWeek(task.dueDate),
        )
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6)

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">
                    My dashboard
                </h1>
                <p className="text-sm text-slate-500">
                    Your projects, priorities and what is due soon.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="My projects"
                    value={loadingProjects ? "…" : projects.length}
                    tone="brand"
                />
                <StatCard
                    label="Total tasks"
                    value={loadingTasks ? "…" : tasks.length}
                />
                <StatCard
                    label="Overdue"
                    value={loadingTasks ? "…" : overdue}
                    tone="rose"
                />
                <StatCard
                    label="Due this week"
                    value={loadingTasks ? "…" : upcoming.length}
                    tone="amber"
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
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Spinner /> Loading…
                            </div>
                        ) : (
                            byPriority.map((row) => (
                                <div
                                    key={row.priority}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-slate-600">
                                        {PRIORITY_LABELS[row.priority]}
                                    </span>
                                    <span className="font-medium text-slate-800">
                                        {row.count}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card className="xl:col-span-2">
                    <CardHeader
                        title="Upcoming due dates"
                        subtitle="Next seven days"
                    />
                    {loadingTasks ? (
                        <div className="flex items-center gap-2 px-5 py-4 text-sm text-slate-500">
                            <Spinner /> Loading…
                        </div>
                    ) : upcoming.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-slate-500">
                            Nothing due in the next week.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {upcoming.map((task) => (
                                <li
                                    key={task._id}
                                    className="flex items-center justify-between px-5 py-3 text-sm"
                                >
                                    <span className="text-slate-700">
                                        #{task.taskNumber} {task.title}
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
                        <div className="flex items-center gap-2 px-5 py-4 text-sm text-slate-500">
                            <Spinner /> Loading…
                        </div>
                    ) : projects.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-slate-500">
                            You do not manage any projects yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {projects.map((project) => (
                                <li key={project._id}>
                                    <Link
                                        to={`/projects/${project._id}`}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                                    >
                                        <span className="text-sm text-slate-700">
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
