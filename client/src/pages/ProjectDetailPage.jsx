import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useParams } from "react-router-dom"

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
import {
    Button,
    Card,
    CardHeader,
    EmptyState,
    PageHeader,
    Skeleton,
    StatCard,
    TableSkeleton,
} from "../components/ui.jsx"
import { pushToast } from "../features/ui/uiSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import { STATUS_LABELS, TASK_STATUSES } from "../lib/constants.js"
import { fullName } from "../lib/format.js"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"

const ProjectDetailPage = () => {
    const dispatch = useDispatch()
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

    useDocumentMeta(
        project ? project.projectTitle : "Project",
        project?.projectDescription,
    )

    if (error) {
        return (
            <Card className="mx-auto max-w-lg">
                <EmptyState
                    title={
                        error?.status === 404
                            ? "Project not found"
                            : "Could not load this project"
                    }
                    hint={
                        error?.status === 404
                            ? "It may have been removed, or you may not have access to it."
                            : "Check your connection and try again."
                    }
                    action={
                        <Link to="/projects">
                            <Button variant="secondary" size="sm">
                                Back to projects
                            </Button>
                        </Link>
                    }
                />
            </Card>
        )
    }

    if (isLoading || !project) {
        return (
            <div className="space-y-6">
                <div className="space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-72" />
                    <Skeleton className="h-4 w-full max-w-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {TASK_STATUSES.map((status) => (
                        <Skeleton key={status} className="h-20 w-full" />
                    ))}
                </div>
                <Card>
                    <TableSkeleton rows={5} cols={5} />
                </Card>
            </div>
        )
    }

    const counts = TASK_STATUSES.map((status) => ({
        status,
        count: tasks.filter((task) => task.status === status).length,
    }))

    const onStatus = async (taskId, status) => {
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

    return (
        <div className="space-y-6">
            <div>
                <Link
                    to="/projects"
                    className="inline-flex items-center gap-1 text-xs text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                    ← All projects
                </Link>

                <div className="mt-3">
                    <PageHeader
                        eyebrow={`Client · ${project.client?.companyName || "—"}`}
                        title={project.projectTitle}
                        description={project.projectDescription}
                        actions={
                            canManage ? (
                                <Button onClick={() => setCreateOpen(true)}>
                                    New task
                                </Button>
                            ) : null
                        }
                    />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
                    <ProjectStatusBadge status={project.status} />
                    <span className="text-faint">|</span>
                    <span>
                        Manager ·{" "}
                        <span className="text-ink">
                            {fullName(project.projectManager)}
                        </span>
                    </span>
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
                <CardHeader
                    title="Tasks"
                    subtitle="Filtered view; your filters stay in the URL"
                />
                <div className="border-b border-line px-4 py-4 sm:px-5">
                    <TaskFilters />
                </div>
                {loadingTasks ? (
                    <TableSkeleton rows={5} cols={5} />
                ) : (
                    <TaskTable
                        tasks={tasks}
                        canChangeStatus={canManage}
                        onOpen={setOpenTaskId}
                        onStatus={onStatus}
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

            {/* Mounted only while open so the draft always starts clean. */}
            {createOpen ? (
                <CreateTaskModal
                    open
                    projectId={id}
                    onClose={() => setCreateOpen(false)}
                />
            ) : null}
        </div>
    )
}

export default ProjectDetailPage
