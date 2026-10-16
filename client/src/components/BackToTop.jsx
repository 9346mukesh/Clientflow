import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { IconArrowUp } from "./icons.jsx"

// Appears once the reader is a screen or so down the page.
const BackToTop = () => {
    const [visible, setVisible] = useState(false)
    const cookieConsent = useSelector((state) => state.ui.cookieConsent)

    useEffect(() => {
        const read = () => setVisible(window.scrollY > 480)
        read()
        window.addEventListener("scroll", read, { passive: true })
        return () => window.removeEventListener("scroll", read)
    }, [])

    if (!visible) return null

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            title="Back to top"
            // sit above the cookie banner while it is on screen
            className={`fixed right-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink shadow-lg transition-colors hover:bg-surface-2 sm:right-6 ${
                cookieConsent ? "bottom-4 sm:bottom-6" : "bottom-28 sm:bottom-32"
            }`}
        >
            <IconArrowUp />
        </button>
    )
}

export default BackToTop
