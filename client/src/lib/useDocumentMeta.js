import { useEffect } from "react"

export const SITE_NAME = "ClientFlow"

const DEFAULT_TITLE = "ClientFlow — real-time client project dashboard"
const DEFAULT_DESCRIPTION =
    "ClientFlow is a real-time client project dashboard for agencies — manage clients, projects and tasks with role-based access and a live activity feed."

// Every page names itself in the tab and keeps the meta description current.
export const useDocumentMeta = (title, description) => {
    useEffect(() => {
        document.title = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE

        const meta = document.querySelector('meta[name="description"]')
        if (meta) {
            meta.setAttribute("content", description || DEFAULT_DESCRIPTION)
        }
    }, [title, description])
}
