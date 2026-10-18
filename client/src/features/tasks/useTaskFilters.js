import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"

import { toDateInput } from "../../lib/format.js"

// The board opens on a ten-day window: five days back through five days forward.
const defaultDueWindow = () => {
    const from = new Date()
    from.setDate(from.getDate() - 5)

    const to = new Date()
    to.setDate(to.getDate() + 5)

    return { dueFrom: toDateInput(from), dueTo: toDateInput(to) }
}

// Filters live in the URL so a filtered view can be shared or bookmarked.
export const useTaskFilters = () => {
    const [params, setParams] = useSearchParams()
    const seeded = useRef(false)

    // Drop the default window into the URL once per visit, unless the link
    // already carries dates. Filling the URL rather than hiding the default in
    // here keeps the inputs honest — emptying a field really does clear it.
    useEffect(() => {
        if (seeded.current) return
        seeded.current = true

        if (params.has("dueFrom") || params.has("dueTo")) return

        const window = defaultDueWindow()
        const next = new URLSearchParams(params)
        next.set("dueFrom", window.dueFrom)
        next.set("dueTo", window.dueTo)
        setParams(next, { replace: true })
    }, [params, setParams])

    const filters = {
        status: params.get("status") || "",
        priority: params.get("priority") || "",
        dueFrom: params.get("dueFrom") || "",
        dueTo: params.get("dueTo") || "",
        project: params.get("project") || "",
    }

    const setFilter = (key, value) => {
        const next = new URLSearchParams(params)
        if (value) next.set(key, value)
        else next.delete(key)
        setParams(next, { replace: true })
    }

    const clear = () => setParams(new URLSearchParams(), { replace: true })

    const hasFilters = Object.values(filters).some(Boolean)

    return { filters, setFilter, clear, hasFilters }
}
