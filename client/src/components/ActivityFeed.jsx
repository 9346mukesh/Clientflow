import { useMemo } from "react"
import { useSelector } from "react-redux"

import { useGetActivityQuery } from "../features/activity/activityApi.js"
import { activityText, relativeTime } from "../lib/format.js"
import {
    Avatar,
    Card,
    CardHeader,
    EmptyState,
    Skeleton,
} from "./ui.jsx"

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

        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
                    {rows.map((row, index) => (
                        <li
                            key={row._id}
                            className="flex items-start gap-3 px-5 py-3"
                        >
                            <Avatar person={row.performedBy} />
                            <div className="min-w-0">
                                <p className="text-sm text-muted">
                                    {activityText(row)}
                                    <span className="text-faint">
                                        {" · "}
                                        <span className="font-mono text-[11px]">
                                            {relativeTime(row.createdAt)}
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
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}

export default ActivityFeed
