import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useSelector } from "react-redux"

import { useGetProjectQuery } from "../features/projects/projectsApi.js"
import {
    useGetTasksQuery,
    useUpdateTaskStatusMutation,
} from "../features/tasks/tasksApi.js"
import { useTaskFilters } from "../features/tasks/useTaskFilters.js"
import { useProjectRoom } from "../sockets/useProjectRoom.js"
import TaskTable from "../components/tasks/TaskTable.jsx"
import TaskDetailModal from "../components/tasks/TaskDetailModal.jsx"
import CreateTaskModal from "../components/tasks/CreateTaskModal.jsx"
import TaskFilters from "../components/TaskFilters.jsx"
import ActivityFeed from "../components/ActivityFeed.jsx"
import { ProjectStatusBadge } from "../components/badges.jsx"
import { Button, Card, StatCard } from "../components/ui.jsx"
import { fullName } from "../lib/format.js"
import { STATUS_LABELS, TASK_STATUSES } from "../lib/constants.js"

const ProjectDetailPage = () => {
    const { id } = useParams()
    const role = useSelector((state) => state.auth.user?.role)
    const canManage = role === "ADMIN" || role === "PROJECT_MANAGER"

    const { data, isLoading, error } = useGetProjectQuery(id)
    const { filters } = useTaskFilters()
    const { data: taskData, isLoading: loadingTasks } = useGetTasksQuery({
        status: filters.status,
        priority: filters.priority,
        dueFrom: filters.dueFrom,
        dueTo: filters.dueTo,
        project: id,
    })
    const [updateStatus] = useUpdateTaskStatusMutation()

    const [openTaskId, setOpenTaskId] = useState(null)
    const [createOpen, setCreateOpen] = useState(false)

    // subscribe to this project's live board updates
    useProjectRoom(id)

    const project = data?.data
    const tasks = taskData?.data || []

    if (error) {
        return (
            <Card className="px-5 py-6 text-sm text-slate-500">
                {error?.status === 404
                    ? "Project not found, or you do not have access to it."
                    : "Could not load this project."}
            </Card>
        )
    }

    if (isLoading || !project) {
        return (
            <Card className="px-5 py-6 text-sm text-slate-500">
                Loading project…
            </Card>
        )
    }

    const counts = TASK_STATUSES.map((status) => ({
        status,
        count: tasks.filter((task) => task.status === status).length,
    }))

    return (
        <div className="space-y-5">
            <div>
                <Link
                    to="/projects"
                    className="text-xs text-slate-500 hover:text-brand-600"
                >
                    ← Projects
                </Link>

                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold text-slate-900">
                                {project.projectTitle}
                            </h1>
                            <ProjectStatusBadge status={project.status} />
                        </div>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            {project.projectDescription}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            {project.client?.companyName} · Manager{" "}
                            {fullName(project.projectManager)}
                        </p>
                    </div>

                    {canManage ? (
                        <Button onClick={() => setCreateOpen(true)}>
                            New task
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {counts.map((row) => (
                    <StatCard
                        key={row.status}
                        label={STATUS_LABELS[row.status]}
                        value={row.count}
                    />
                ))}
            </div>

            <Card>
                <div className="border-b border-slate-100 px-5 py-4">
                    <TaskFilters />
                </div>
                {loadingTasks ? (
                    <p className="px-5 py-6 text-sm text-slate-500">
                        Loading tasks…
                    </p>
                ) : (
                    <TaskTable
                        tasks={tasks}
                        canChangeStatus
                        onOpen={setOpenTaskId}
                        onStatus={(taskId, status) =>
                            updateStatus({ id: taskId, status })
                        }
                    />
                )}
            </Card>

            <ActivityFeed
                limit={30}
                projectId={id}
                title="Project activity"
                subtitle="Live updates on this project"
            />

            <TaskDetailModal
                taskId={openTaskId}
                open={Boolean(openTaskId)}
                onClose={() => setOpenTaskId(null)}
                canEdit={canManage}
            />

            <CreateTaskModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                projectId={id}
            />
        </div>
    )
}

export default ProjectDetailPage
