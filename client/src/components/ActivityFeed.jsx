import { useMemo } from "react"
import { useSelector } from "react-redux"

import { useGetActivityQuery } from "../features/activity/activityApi.js"
import { activityText, relativeTime } from "../lib/format.js"
import { Avatar, Card, CardHeader, EmptyState, Spinner } from "./ui.jsx"

// A live feed. Historical rows come from the database; `activity:new` rows are
// appended over the socket. The two are merged and de-duplicated by _id.
const ActivityFeed = ({ limit = 20, projectId, title = "Activity", subtitle }) => {
    const { data, isLoading } = useGetActivityQuery({ limit, project: projectId })
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
                <div className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
                    <Spinner /> Loading activity…
                </div>
            ) : rows.length === 0 ? (
                <EmptyState
                    title="No activity yet"
                    hint="Changes to tasks will show up here in real time."
                />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {rows.map((row) => (
                        <li
                            key={row._id}
                            className="flex items-start gap-3 px-5 py-3"
                        >
                            <Avatar person={row.performedBy} />
                            <div className="min-w-0">
                                <p className="text-sm text-slate-700">
                                    {activityText(row)}
                                    <span className="text-slate-400">
                                        {" · "}
                                        {relativeTime(row.createdAt)}
                                    </span>
                                </p>
                                {row.project?.projectTitle ? (
                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                        {row.project.projectTitle}
                                    </p>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}

export default ActivityFeed
