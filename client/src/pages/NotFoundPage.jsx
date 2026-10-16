import { Link } from "react-router-dom"

import { Button } from "../components/ui.jsx"

const NotFoundPage = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-3xl font-semibold text-slate-300">404</p>
        <p className="text-sm text-slate-600">
            We could not find that page.
        </p>
        <Link to="/">
            <Button variant="secondary">Back to dashboard</Button>
        </Link>
    </div>
)

export default NotFoundPage
