import { Link } from "react-router-dom"

import { Button } from "../components/ui.jsx"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"

const NotFoundPage = () => {
    useDocumentMeta(
        "Page not found",
        "The page you were looking for does not exist in ClientFlow.",
    )

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center sm:py-28">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                Error 404
            </p>

            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                That page does not exist
            </h1>

            <p className="mt-2 max-w-md text-sm text-muted">
                The link may be out of date, or the project or task it pointed
                to may have been removed.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Link to="/">
                    <Button>Back to dashboard</Button>
                </Link>
                <Link to="/projects">
                    <Button variant="secondary">Browse projects</Button>
                </Link>
            </div>

            <p className="mt-8 font-mono text-[11px] text-faint">
                Tip: press ⌘K or Ctrl-K to search from anywhere.
            </p>
        </div>
    )
}

export default NotFoundPage
