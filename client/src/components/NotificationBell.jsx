import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import {
    useGetNotificationsQuery,
    useMarkAllReadMutation,
    useMarkReadMutation,
} from "../features/notifications/notificationsApi.js"
import { setUnreadCount } from "../features/notifications/notificationsSlice.js"
import { relativeTime } from "../lib/format.js"
import { EmptyState, Spinner } from "./ui.jsx"

const TYPE_ICON = {
    TASK_ASSIGNED: "📌",
    TASK_IN_REVIEW: "🔎",
    TASK_OVERDUE: "⏰",
}

const NotificationBell = () => {
    const dispatch = useDispatch()
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    const storeCount = useSelector((state) => state.notifications.unreadCount)
    const live = useSelector((state) => state.notifications.live)

    const { data, isLoading } = useGetNotificationsQuery({ limit: 20 })
    const [markRead] = useMarkReadMutation()
    const [markAllRead, { isLoading: markingAll }] = useMarkAllReadMutation()

    // the count from the API seeds the badge; the socket keeps it fresh after
    useEffect(() => {
        if (data && typeof data.unreadCount === "number") {
            dispatch(setUnreadCount(data.unreadCount))
        }
    }, [data, dispatch])

    // close on an outside click
    useEffect(() => {
        const onClick = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", onClick)
        return () => document.removeEventListener("mousedown", onClick)
    }, [])

    const items = useMemo(() => {
        const fetched = data?.data || []
        const seen = new Set()
        const merged = []

        for (const item of [...live, ...fetched]) {
            if (!item?._id || seen.has(item._id)) continue
            seen.add(item._id)
            merged.push(item)
        }

        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return merged.slice(0, 20)
    }, [data, live])

    const onOpenItem = async (item) => {
        if (!item.isRead) {
            await markRead(item._id)
            dispatch(setUnreadCount(Math.max(storeCount - 1, 0)))
        }
    }

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Notifications"
            >
                <span className="text-lg">🔔</span>
                {storeCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                        {storeCount > 99 ? "99+" : storeCount}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                        <span className="text-sm font-semibold text-slate-800">
                            Notifications
                        </span>
                        <button
                            type="button"
                            disabled={markingAll || storeCount === 0}
                            onClick={async () => {
                                await markAllRead()
                                dispatch(setUnreadCount(0))
                            }}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40"
                        >
                            Mark all read
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500">
                                <Spinner /> Loading…
                            </div>
                        ) : items.length === 0 ? (
                            <EmptyState title="You're all caught up" />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <li key={item._id}>
                                        <button
                                            type="button"
                                            onClick={() => onOpenItem(item)}
                                            className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                                                item.isRead
                                                    ? ""
                                                    : "bg-brand-50/40"
                                            }`}
                                        >
                                            <span className="text-base">
                                                {TYPE_ICON[item.type] || "•"}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-slate-800">
                                                    {item.title}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-slate-500">
                                                    {item.message}
                                                </span>
                                                <span className="mt-1 block text-[11px] text-slate-400">
                                                    {relativeTime(
                                                        item.createdAt,
                                                    )}
                                                </span>
                                            </span>
                                            {item.isRead ? null : (
                                                <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default NotificationBell
