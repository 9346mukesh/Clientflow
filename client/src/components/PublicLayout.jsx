import { Link } from "react-router-dom"
import { useSelector } from "react-redux"

import Brand from "./Brand.jsx"
import Footer from "./Footer.jsx"
import ThemeToggle from "../features/theme/ThemeToggle.jsx"

// The shell for pages anyone can read: legal text, and anything else that is
// not behind a sign-in.
const PublicLayout = ({ children }) => {
    // Signed-in readers get a route back into the app instead of a sign-in link.
    const isAuthed = useSelector((state) => Boolean(state.auth.accessToken))

    return (
        <div className="flex min-h-screen flex-col bg-page">
            <a
                href="#public-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-action focus:px-3 focus:py-2 focus:text-sm focus:text-on-action"
            >
                Skip to content
            </a>

            <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
                <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Brand />
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <Link
                            to={isAuthed ? "/" : "/login"}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                            {isAuthed ? "Dashboard" : "Sign in"}
                        </Link>
                    </div>
                </div>
            </header>

            <main
                id="public-content"
                className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
            >
                {children}
            </main>

            <Footer />
        </div>
    )
}

export default PublicLayout
