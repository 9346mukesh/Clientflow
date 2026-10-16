import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { dismissToast } from "../features/ui/uiSlice.js"
import { IconAlert, IconCheck, IconClose } from "./icons.jsx"

const toneClasses = (tone) =>
    tone === "error"
        ? {
              box: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/70",
              text: "text-red-800 dark:text-red-200",
          }
        : {
              box: "border-line bg-surface",
              text: "text-ink",
          }

const Toast = ({ toast }) => {
    const dispatch = useDispatch()
    const classes = toneClasses(toast.tone)

    // Every toast clears itself; errors linger a little longer.
    useEffect(() => {
        const timer = setTimeout(
            () => dispatch(dismissToast(toast.id)),
            toast.tone === "error" ? 7000 : 4500,
        )
        return () => clearTimeout(timer)
    }, [dispatch, toast.id, toast.tone])

    return (
        <div
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg ${classes.box}`}
        >
            {toast.tone === "error" ? (
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            ) : (
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            )}
            <p className={`flex-1 text-sm ${classes.text}`}>{toast.message}</p>
            <button
                type="button"
                onClick={() => dispatch(dismissToast(toast.id))}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 rounded-md p-1 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
            >
                <IconClose className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}

// Mounted once at the root. Toasts stack at the top centre so they never
// collide with the cookie banner or the back-to-top button.
const Toaster = () => {
    const toasts = useSelector((state) => state.ui.toasts)

    if (toasts.length === 0) return null

    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
            <div className="flex w-full max-w-sm flex-col gap-2">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} />
                ))}
            </div>
        </div>
    )
}

export default Toaster
