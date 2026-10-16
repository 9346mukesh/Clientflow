import { useSearchParams } from "react-router-dom"

// Filters live in the URL so a filtered view can be shared or bookmarked.
export const useTaskFilters = () => {
    const [params, setParams] = useSearchParams()

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
