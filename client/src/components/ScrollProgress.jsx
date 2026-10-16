import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

// The signature 2px graphite rail across the top of the viewport.
//
//  - normally it tracks how far down the page the reader is
//  - while a write is in flight it becomes an indeterminate sweep, so the
//    user gets a quiet, always-in-the-same-place progress cue
//
// Decorative either way, so it is hidden from assistive tech.
const ScrollProgress = () => {
    const [progress, setProgress] = useState(0)

    const busy = useSelector((state) =>
        Object.values(state.api.mutations).some(
            (mutation) => mutation?.status === "pending",
        ),
    )

    useEffect(() => {
        const read = () => {
            const element = document.documentElement
            const scrollable = element.scrollHeight - element.clientHeight
            setProgress(scrollable > 0 ? element.scrollTop / scrollable : 0)
        }

        read()
        window.addEventListener("scroll", read, { passive: true })
        window.addEventListener("resize", read)

        return () => {
            window.removeEventListener("scroll", read)
            window.removeEventListener("resize", read)
        }
    }, [])

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-0.5 overflow-hidden"
        >
            {busy ? (
                <div className="indeterminate-bar h-full w-1/4 bg-ink" />
            ) : (
                <div
                    className="h-full origin-left bg-ink transition-transform duration-75 ease-out"
                    style={{ transform: `scaleX(${progress})` }}
                />
            )}
        </div>
    )
}

export default ScrollProgress
