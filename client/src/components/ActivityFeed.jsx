import { useMemo, useState } from "react"
import { useSelector } from "react-redux"

import { useGetActivityQuery } from "../features/activity/activityApi.js"
import { activityText, relativeTime } from "../lib/format.js"
import TaskDetailModal from "./tasks/TaskDetailModal.jsx"
import {
    Avatar,
    Card,
    CardHeader,
    EmptyState,
    Skeleton,
} from "./ui.jsx"

// Two rows written in the same millisecond — a task is created and assigned in
// one call — tie on time, so the id settles it. Ids are monotonic, which puts
// the later write on top.
const byNewest = (a, b) => {
    const age = new Date(b.createdAt) - new Date(a.createdAt)
    if (age !== 0) return age
    return String(b._id).localeCompare(String(a._id))
}

// A live feed. Historical rows come from the database; `activity:new` rows are
// appended over the socket. The two are merged and de-duplicated by _id.
const ActivityFeed = ({
    limit = 20,
    projectId,
    title = "Activity",
    subtitle,
}) => {
    const { data, isLoading } = useGetActivityQuery({
        limit,
        project: projectId,
    })
    const live = useSelector((state) => state.activity.live)
    const role = useSelector((state) => state.auth.user?.role)

    // A row opens the same detail panel the task board uses.
    const [openTaskId, setOpenTaskId] = useState(null)
    const canEdit = role === "ADMIN" || role === "PROJECT_MANAGER"

    const rows = useMemo(() => {
        const fetched = data?.data || []

        const liveForView = projectId
            ? live.filter((row) => row.project?._id === projectId)
            : live

        const seen = new Set()
        const merged = []

        for (const row of [...fetched, ...liveForView]) {
            if (!row?._id || seen.has(row._id)) continue
            seen.add(row._id)
            merged.push(row)
        }

        merged.sort(byNewest)
        return merged.slice(0, limit)
    }, [data, live, projectId, limit])

    return (
        <Card>
            <CardHeader
                title={title}
                subtitle={subtitle || `Latest ${limit} events`}
            />

            {isLoading ? (
                <div className="space-y-4 px-5 py-5">
                    {[0, 1, 2, 3, 4].map((row) => (
                        <div key={row} className="flex items-start gap-3">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3.5 w-3/4" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <EmptyState
                    title="No activity yet"
                    hint="Changes to tasks will show up here in real time."
                />
            ) : (
                <ul className="divide-y divide-line">
                    {rows.map((row, index) => {
                        const taskId = row.task?._id
                        // the scheduled sweep's own event is what the red marks
                        const overdue = row.action === "MARKED_OVERDUE"

                        return (
                            <li key={row._id}>
                                <button
                                    type="button"
                                    disabled={!taskId}
                                    onClick={() => {
                                        if (taskId) setOpenTaskId(taskId)
                                    }}
                                    title={
                                        taskId ? "Open task details" : undefined
                                    }
                                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none disabled:cursor-default"
                                >
                                    <Avatar person={row.performedBy} />
                                    <div className="min-w-0">
                                        <p
                                            className={`text-sm ${
                                                overdue
                                                    ? "font-medium text-danger"
                                                    : "text-muted"
                                            }`}
                                        >
                                            {activityText(row)}
                                            <span className="text-faint">
                                                {" · "}
                                                <span className="font-mono text-[11px]">
                                                    {relativeTime(
                                                        row.createdAt,
                                                    )}
                                                </span>
                                            </span>
                                        </p>
                                        {row.project?.projectTitle ? (
                                            <p className="mt-0.5 truncate text-xs text-faint">
                                                {row.project.projectTitle}
                                            </p>
                                        ) : null}
                                    </div>
                                    {index === 0 ? (
                                        <span
                                            aria-hidden="true"
                                            className="ml-auto mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink"
                                        />
                                    ) : null}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}

            <TaskDetailModal
                taskId={openTaskId}
                open={Boolean(openTaskId)}
                onClose={() => setOpenTaskId(null)}
                canEdit={canEdit}
            />
        </Card>
    )
}

export default ActivityFeed
