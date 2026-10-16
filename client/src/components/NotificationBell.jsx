import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import {
    useGetNotificationsQuery,
    useMarkAllReadMutation,
    useMarkReadMutation,
} from "../features/notifications/notificationsApi.js"
import { setUnreadCount } from "../features/notifications/notificationsSlice.js"
import { pushToast } from "../features/ui/uiSlice.js"
import { relativeTime } from "../lib/format.js"
import { EmptyState, Skeleton } from "./ui.jsx"
import {
    IconBell,
    IconClock,
    IconInbox,
    IconPin,
    IconSearch,
} from "./icons.jsx"

const TYPE_ICON = {
    TASK_ASSIGNED: IconPin,
    TASK_IN_REVIEW: IconSearch,
    TASK_OVERDUE: IconClock,
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

    // close on an outside click or Escape
    useEffect(() => {
        const onPointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        const onKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false)
        }

        document.addEventListener("mousedown", onPointerDown)
        document.addEventListener("keydown", onKeyDown)

        return () => {
            document.removeEventListener("mousedown", onPointerDown)
            document.removeEventListener("keydown", onKeyDown)
        }
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
        if (item.isRead) return

        await markRead(item._id)
        dispatch(setUnreadCount(Math.max(storeCount - 1, 0)))
    }

    const onMarkAll = async () => {
        if (storeCount === 0) return

        await markAllRead()
        dispatch(setUnreadCount(0))
        dispatch(pushToast({ message: "All notifications marked as read." }))
    }

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label={
                    storeCount > 0
                        ? `Notifications, ${storeCount} unread`
                        : "Notifications"
                }
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
                <IconBell />
                {storeCount > 0 ? (
                    <span
                        aria-hidden="true"
                        className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-ink px-1 font-mono text-[10px] font-semibold text-page"
                    >
                        {storeCount > 99 ? "99+" : storeCount}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="fixed inset-x-4 top-16 z-40 overflow-hidden rounded-xl border border-line bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                    <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                        <span className="font-display text-sm font-semibold tracking-tight text-ink">
                            Notifications
                        </span>
                        <button
                            type="button"
                            disabled={markingAll || storeCount === 0}
                            onClick={onMarkAll}
                            className="text-xs font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
                        >
                            Mark all read
                        </button>
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto sm:max-h-96">
                        {isLoading ? (
                            <div className="space-y-3 px-4 py-4">
                                {[0, 1, 2].map((row) => (
                                    <Skeleton key={row} className="h-10 w-full" />
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <EmptyState
                                title="You're all caught up"
                                hint="Assignments and review requests will land here."
                            />
                        ) : (
                            <ul className="divide-y divide-line">
                                {items.map((item) => {
                                    const Icon = TYPE_ICON[item.type] || IconInbox

                                    return (
                                        <li key={item._id}>
                                            <button
                                                type="button"
                                                onClick={() => onOpenItem(item)}
                                                className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                                                    item.isRead
                                                        ? ""
                                                        : "bg-surface-2/60"
                                                }`}
                                            >
                                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium text-ink">
                                                        {item.title}
                                                    </span>
                                                    <span className="mt-0.5 block text-xs text-muted">
                                                        {item.message}
                                                    </span>
                                                    <span className="mt-1 block font-mono text-[11px] text-faint">
                                                        {relativeTime(
                                                            item.createdAt,
                                                        )}
                                                    </span>
                                                </span>
                                                {item.isRead ? null : (
                                                    <span
                                                        aria-label="Unread"
                                                        className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-ink"
                                                    />
                                                )}
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default NotificationBell
