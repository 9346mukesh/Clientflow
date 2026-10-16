import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { useGetClientsQuery } from "../features/clients/clientsApi.js"
import { useGetProjectsQuery } from "../features/projects/projectsApi.js"
import { useGetTasksQuery } from "../features/tasks/tasksApi.js"
import { useGetUsersQuery } from "../features/users/usersApi.js"
import { fullName } from "../lib/format.js"
import { isApplePlatform } from "../lib/platform.js"
import { IconSearch } from "./icons.jsx"

const LIMIT_PER_GROUP = 5

const includesQuery = (value, query) =>
    String(value || "").toLowerCase().includes(query)

// The button that opens the palette. Layout renders one per breakpoint and
// owns the open state, so a single overlay serves both. `compact` is the
// icon-only form used in the mobile top bar.
export const SearchTrigger = ({ onClick, compact = false, className = "" }) => {
    if (compact) {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label="Search ClientFlow"
                title={`Search (${isApplePlatform() ? "⌘K" : "Ctrl K"})`}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
            >
                <IconSearch />
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
        >
            <IconSearch />
            <span className="hidden sm:inline">Search…</span>
            <kbd className="ml-auto hidden rounded border border-line bg-surface-2 px-1.5 font-mono text-[10px] text-faint sm:inline">
                {isApplePlatform() ? "⌘K" : "Ctrl K"}
            </kbd>
        </button>
    )
}

// Mounted only while open, so the query always starts blank.
const SearchPanel = ({ onClose }) => {
    const navigate = useNavigate()
    const role = useSelector((state) => state.auth.user?.role)

    const [query, setQuery] = useState("")
    const [activeIndex, setActiveIndex] = useState(0)

    const panelRef = useRef(null)
    const inputRef = useRef(null)

    const canSeeProjects = role === "ADMIN" || role === "PROJECT_MANAGER"
    const canSeeClients = role === "ADMIN"
    const canSeeUsers = role === "ADMIN"

    // Only endpoints the signed-in user is already allowed to call are read,
    // so results can never leak across roles.
    const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery(
        undefined,
        {
            skip: !canSeeProjects,
        },
    )
    const { data: tasks, isLoading: tasksLoading } = useGetTasksQuery()
    const { data: clients, isLoading: clientsLoading } = useGetClientsQuery(
        undefined,
        {
            skip: !canSeeClients,
        },
    )
    const { data: users, isLoading: usersLoading } = useGetUsersQuery(
        undefined,
        {
            skip: !canSeeUsers,
        },
    )

    // Skipped hooks report false, so this only trips for data the user may read.
    const loading =
        projectsLoading || tasksLoading || clientsLoading || usersLoading

    const results = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return []

        const found = []
        const countIn = (group) =>
            found.filter((result) => result.group === group).length

        if (canSeeProjects) {
            for (const project of projects?.data || []) {
                if (countIn("Projects") >= LIMIT_PER_GROUP) break
                if (
                    includesQuery(project.projectTitle, needle) ||
                    includesQuery(project.client?.clientName, needle) ||
                    includesQuery(project.projectDescription, needle)
                ) {
                    found.push({
                        key: `project-${project._id}`,
                        group: "Projects",
                        title: project.projectTitle,
                        meta:
                            project.client?.companyName ||
                            project.client?.clientName ||
                            "",
                        to: `/projects/${project._id}`,
                    })
                }
            }
        }

        if (canSeeClients) {
            for (const client of clients?.data || []) {
                if (countIn("Clients") >= LIMIT_PER_GROUP) break
                if (
                    includesQuery(client.clientName, needle) ||
                    includesQuery(client.companyName, needle) ||
                    includesQuery(client.email, needle)
                ) {
                    found.push({
                        key: `client-${client._id}`,
                        group: "Clients",
                        title: client.clientName,
                        meta: client.companyName || "",
                        to: `/clients?q=${encodeURIComponent(client.clientName)}`,
                    })
                }
            }
        }

        for (const task of tasks?.data || []) {
            if (countIn("Tasks") >= LIMIT_PER_GROUP) break
            if (
                includesQuery(task.title, needle) ||
                includesQuery(`#${task.taskNumber}`, needle) ||
                includesQuery(task.project?.projectTitle, needle)
            ) {
                found.push({
                    key: `task-${task._id}`,
                    group: "Tasks",
                    title: `#${task.taskNumber} ${task.title}`,
                    meta: task.project?.projectTitle || "",
                    to: `/tasks?task=${task._id}`,
                })
            }
        }

        if (canSeeUsers) {
            for (const user of users?.data || []) {
                if (countIn("People") >= LIMIT_PER_GROUP) break
                const name = fullName(user)
                if (
                    includesQuery(name, needle) ||
                    includesQuery(user.email, needle)
                ) {
                    found.push({
                        key: `user-${user._id}`,
                        group: "People",
                        title: name,
                        meta: user.email || "",
                        to: `/users?q=${encodeURIComponent(name)}`,
                    })
                }
            }
        }

        return found
    }, [
        query,
        projects,
        tasks,
        clients,
        users,
        canSeeProjects,
        canSeeClients,
        canSeeUsers,
    ])

    // Hold the page still and put the cursor in the field.
    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        inputRef.current?.focus()

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [])

    const go = (result) => {
        if (!result) return
        onClose?.()
        navigate(result.to)
    }

    const onKeyDown = (event) => {
        if (event.key === "Escape") {
            event.preventDefault()
            onClose?.()
            return
        }

        if (event.key === "ArrowDown") {
            event.preventDefault()
            setActiveIndex((index) =>
                results.length === 0 ? 0 : (index + 1) % results.length,
            )
            return
        }

        if (event.key === "ArrowUp") {
            event.preventDefault()
            setActiveIndex((index) =>
                results.length === 0
                    ? 0
                    : (index - 1 + results.length) % results.length,
            )
            return
        }

        if (event.key === "Enter") {
            event.preventDefault()
            go(results[activeIndex])
            return
        }

        if (event.key === "Tab") {
            // Options are skipped: the cursor stays in the field and the
            // active row is announced through aria-activedescendant.
            const focusables = panelRef.current?.querySelectorAll(
                'input, button:not([role="option"]), a[href]',
            )
            if (!focusables || focusables.length === 0) return
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
    }

    const listId = "clientflow-search-results"

    // Results arrive already grouped (projects, clients, tasks, people); split
    // them so the listbox can expose each group with its own name.
    const grouped = []
    for (const result of results) {
        const last = grouped[grouped.length - 1]
        if (last && last.name === result.group) last.items.push(result)
        else grouped.push({ name: result.group, items: [result] })
    }

    // Running index across the groups, so the flat arrow-key position maps to
    // the right row no matter which group it sits in.
    let flatIndex = -1

    return (
        <div
            className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-neutral-950/50 p-4 sm:pt-[12vh]"
            onMouseDown={() => onClose?.()}
            onKeyDown={onKeyDown}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Search ClientFlow"
                className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center gap-2 border-b border-line px-4">
                    <IconSearch className="h-4 w-4 shrink-0 text-faint" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value)
                            setActiveIndex(0)
                        }}
                        placeholder="Search projects, tasks, clients and people…"
                        aria-label="Search query"
                        role="combobox"
                        aria-expanded={results.length > 0}
                        aria-controls={results.length > 0 ? listId : undefined}
                        aria-autocomplete="list"
                        aria-activedescendant={
                            results.length > 0
                                ? `search-option-${results[activeIndex]?.key}`
                                : undefined
                        }
                        className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
                    />
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint transition-colors hover:text-ink"
                    >
                        Esc
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {query.trim() === "" ? (
                        <p className="px-4 py-8 text-center text-xs text-muted">
                            Search across everything you have access to. Use
                            ↑ ↓ to move and Enter to open.
                        </p>
                    ) : results.length === 0 && loading ? (
                        <p className="px-4 py-8 text-center text-xs text-muted">
                            Searching…
                        </p>
                    ) : results.length === 0 ? (
                        <p className="px-4 py-8 text-center text-xs text-muted">
                            No matches for “{query.trim()}”.
                        </p>
                    ) : (
                        <div
                            id={listId}
                            role="listbox"
                            aria-label="Search results"
                            className="py-2"
                        >
                            {grouped.map((group) => (
                                <div
                                    key={group.name}
                                    role="group"
                                    aria-label={group.name}
                                >
                                    <p
                                        aria-hidden="true"
                                        className="px-4 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint"
                                    >
                                        {group.name}
                                    </p>
                                    {group.items.map((result) => {
                                        flatIndex += 1
                                        const index = flatIndex
                                        const active = index === activeIndex

                                        return (
                                            <button
                                                key={result.key}
                                                id={`search-option-${result.key}`}
                                                type="button"
                                                role="option"
                                                aria-selected={active}
                                                tabIndex={-1}
                                                onMouseEnter={() =>
                                                    setActiveIndex(index)
                                                }
                                                onClick={() => go(result)}
                                                className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm transition-colors ${
                                                    active
                                                        ? "bg-surface-2"
                                                        : "hover:bg-surface-2"
                                                }`}
                                            >
                                                <span className="truncate font-medium text-ink">
                                                    {result.title}
                                                </span>
                                                {result.meta ? (
                                                    <span className="shrink-0 truncate text-xs text-faint">
                                                        {result.meta}
                                                    </span>
                                                ) : null}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const SiteSearch = ({ open, onClose }) =>
    open ? <SearchPanel onClose={onClose} /> : null

export default SiteSearch
