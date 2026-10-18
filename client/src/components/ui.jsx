import { useEffect, useId, useRef, useState } from "react"

// Small, dependency-free building blocks shared by every page.

export const Card = ({ className = "", children }) => (
    <div
        className={`rounded-xl border border-line bg-surface shadow-sm ${className}`}
    >
        {children}
    </div>
)

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
            <h2 className="font-display text-sm font-semibold tracking-tight text-ink">
                {title}
            </h2>
            {subtitle ? (
                <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
            ) : null}
        </div>
        {action}
    </div>
)

// A page opener. The monospace eyebrow carries a real count, e.g. "PROJECTS · 03".
export const PageHeader = ({ eyebrow, title, description, actions }) => (
    <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
            {eyebrow ? (
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                    {eyebrow}
                </p>
            ) : null}
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                {title}
            </h1>
            {description ? (
                <p className="mt-1 max-w-2xl text-sm text-muted">
                    {description}
                </p>
            ) : null}
        </div>
        {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
    </div>
)

const BUTTON_VARIANTS = {
    primary:
        "bg-action text-on-action hover:bg-action-hover active:bg-action-hover",
    secondary:
        "border border-line-strong bg-surface text-ink hover:bg-surface-2 hover:border-ink/40",
    ghost: "text-muted hover:bg-surface-2 hover:text-ink",
    danger:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-neutral-950 dark:hover:bg-red-400",
    dangerGhost:
        "text-danger hover:bg-red-50 dark:hover:bg-red-950/40",
}

const BUTTON_SIZES = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-2 text-sm",
}

export const Button = ({
    variant = "primary",
    size = "md",
    className = "",
    type = "button",
    loading = false,
    disabled = false,
    children,
    ...props
}) => (
    <button
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
        {...props}
    >
        {loading ? <Spinner className="h-3.5 w-3.5" /> : null}
        {children}
    </button>
)

// An icon-only control still needs an accessible name.
export const IconButton = ({ label, className = "", children, ...props }) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
        {...props}
    >
        {children}
    </button>
)

export const Badge = ({ className = "", children }) => (
    <span
        className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
        {children}
    </span>
)

// Field keeps the implicit label association, so clicking the label focuses
// the control. `error` renders an announced message and hides the hint.
export const Field = ({ label, error, hint, required = false, children }) => (
    <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
            {label}
            {required ? (
                <span aria-hidden="true" className="text-danger">
                    *
                </span>
            ) : null}
        </span>
        {children}
        {error ? (
            <span role="alert" className="mt-1 block text-xs text-danger">
                {error}
            </span>
        ) : hint ? (
            <span className="mt-1 block text-xs text-faint">{hint}</span>
        ) : null}
    </label>
)

// Base for every text field and select. Note the leading `w-full`: a caller
// cannot win by adding another width class to the same element, because CSS
// order — not class order — decides ties. Size the parent instead, e.g. a
// `<td className="w-44">` or a wrapping `<div className="w-36">`.
const CONTROL =
    "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint transition-colors disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted"

const controlBorder = (invalid) =>
    invalid
        ? "border-red-500 dark:border-red-400"
        : "border-line-strong hover:border-ink/40"

export const Input = ({ className = "", invalid = false, ...props }) => (
    <input
        aria-invalid={invalid || undefined}
        className={`${CONTROL} ${controlBorder(invalid)} ${className}`}
        {...props}
    />
)

export const Textarea = ({
    className = "",
    invalid = false,
    rows = 3,
    ...props
}) => (
    <textarea
        aria-invalid={invalid || undefined}
        rows={rows}
        className={`${CONTROL} ${controlBorder(invalid)} ${className}`}
        {...props}
    />
)

export const Select = ({ className = "", invalid = false, children, ...props }) => (
    <select
        aria-invalid={invalid || undefined}
        className={`${CONTROL} ${controlBorder(invalid)} pr-8 ${className}`}
        {...props}
    >
        {children}
    </select>
)

// Password field with a show/hide control.
export const PasswordInput = ({ className = "", invalid = false, ...props }) => {
    const [visible, setVisible] = useState(false)

    return (
        <div className="relative">
            <input
                type={visible ? "text" : "password"}
                aria-invalid={invalid || undefined}
                className={`${CONTROL} ${controlBorder(invalid)} pr-16 ${className}`}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-pressed={visible}
                className="absolute inset-y-0 right-0 my-1 mr-1 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
                {visible ? "Hide" : "Show"}
            </button>
        </div>
    )
}

export const Spinner = ({ className = "" }) => (
    <span
        className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
        role="status"
        aria-label="Loading"
    />
)

export const Skeleton = ({ className = "" }) => (
    <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />
)

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
    <div className="divide-y divide-line" aria-hidden="true">
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4 px-5 py-3.5">
                <Skeleton className="h-4 flex-1" />
                {Array.from({ length: cols - 1 }).map((__, colIndex) => (
                    <Skeleton key={colIndex} className="h-4 w-24" />
                ))}
            </div>
        ))}
    </div>
)

export const CardsSkeleton = ({ count = 3 }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
            <div
                key={index}
                className="rounded-xl border border-line bg-surface p-5"
            >
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-4/5" />
                <Skeleton className="mt-4 h-3 w-1/3" />
            </div>
        ))}
    </div>
)

export const EmptyState = ({ title, hint, action }) => (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink">{title}</p>
        {hint ? <p className="max-w-sm text-xs text-muted">{hint}</p> : null}
        {action ? <div className="mt-1">{action}</div> : null}
    </div>
)

export const ErrorNote = ({ children }) =>
    children ? (
        <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
            {children}
        </p>
    ) : null

const MODAL_SIZES = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
}

export const Modal = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
    dismissOnEscape = true,
}) => {
    const panelRef = useRef(null)
    const titleId = useId()
    const descriptionId = useId()

    // Callers pass a fresh closure on every render. Holding these in refs lets
    // the effect below depend on `open` alone — otherwise a keystroke in a form
    // would re-run it, refocus the first control and drop the caret mid-word.
    const onCloseRef = useRef(onClose)
    const dismissOnEscapeRef = useRef(dismissOnEscape)

    useEffect(() => {
        onCloseRef.current = onClose
        dismissOnEscapeRef.current = dismissOnEscape
    }, [onClose, dismissOnEscape])

    useEffect(() => {
        if (!open) return undefined

        const previouslyFocused = document.activeElement
        const { overflow } = document.body.style
        document.body.style.overflow = "hidden"

        const focusables = () =>
            Array.from(
                panelRef.current?.querySelectorAll(
                    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ) || [],
            )

        // Land on the first real field when the dialog has one, so a form opens
        // ready to type; otherwise fall back to the first control in the panel.
        const firstField = panelRef.current?.querySelector(
            'input:not([type="hidden"]), textarea, select',
        )
        const target = firstField || focusables()[0]
        target?.focus()

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                if (!dismissOnEscapeRef.current) return
                event.stopPropagation()
                onCloseRef.current?.()
                return
            }

            if (event.key !== "Tab") return

            const items = focusables()
            if (items.length === 0) return

            const first = items[0]
            const last = items[items.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener("keydown", onKeyDown)

        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.body.style.overflow = overflow
            if (previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus()
            }
        }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-neutral-950/50 p-0 sm:items-center sm:p-4"
            onMouseDown={onClose}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className={`w-full ${MODAL_SIZES[size]} max-h-[92vh] overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-xl sm:my-8 sm:rounded-2xl`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <div>
                        <h2
                            id={titleId}
                            className="font-display text-sm font-semibold tracking-tight text-ink"
                        >
                            {title}
                        </h2>
                        {description ? (
                            <p
                                id={descriptionId}
                                className="mt-0.5 text-xs text-muted"
                            >
                                {description}
                            </p>
                        ) : null}
                    </div>
                    <IconButton label="Close" onClick={onClose}>
                        <span aria-hidden="true">✕</span>
                    </IconButton>
                </div>

                <div className="px-5 py-4">{children}</div>

                {footer ? (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

// Used before anything destructive. Keyboard- and screen-reader-friendly.
export const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    loading = false,
}) => (
    <Modal
        open={open}
        onClose={onClose}
        title={title}
        description={description}
        size="sm"
        footer={
            <>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm} loading={loading}>
                    {confirmLabel}
                </Button>
            </>
        }
    >
        <p className="text-sm text-muted">
            This cannot be undone. Are you sure you want to continue?
        </p>
    </Modal>
)

export const StatCard = ({ label, value, hint, tone = "ink" }) => {
    const tones = {
        ink: "text-ink",
        muted: "text-muted",
        danger: "text-danger",
        success: "text-success",
        warning: "text-warning",
    }

    return (
        <Card className="px-5 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                {label}
            </p>
            <p
                className={`mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-tight ${tones[tone]}`}
            >
                {value}
            </p>
            {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
        </Card>
    )
}

// Initials bubble for a person. Decorative on purpose: every call site renders
// the person's name beside it, so exposing the avatar as well would make screen
// readers announce the same name twice. The title is kept for sighted users
// when the neighbouring name is truncated.
export const Avatar = ({ person, className = "" }) => {
    const first = person?.firstName?.[0] || "?"
    const last = person?.lastName?.[0] || ""
    const name = [person?.firstName, person?.lastName].filter(Boolean).join(" ")

    return (
        <span
            aria-hidden="true"
            title={name || undefined}
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink ring-1 ring-inset ring-line ${className}`}
        >
            {(first + last).toUpperCase()}
        </span>
    )
}
