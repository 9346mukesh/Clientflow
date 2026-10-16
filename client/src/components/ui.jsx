// Small, dependency-free building blocks shared by every page.

export const Card = ({ className = "", children }) => (
    <div
        className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
        {children}
    </div>
)

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {subtitle ? (
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            ) : null}
        </div>
        {action}
    </div>
)

const BUTTON_VARIANTS = {
    primary:
        "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
    secondary:
        "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60",
    ghost: "text-slate-600 hover:bg-slate-100 disabled:opacity-60",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
}

export const Button = ({
    variant = "primary",
    className = "",
    type = "button",
    children,
    ...props
}) => (
    <button
        type={type}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
        {...props}
    >
        {children}
    </button>
)

export const Badge = ({ className = "", children }) => (
    <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
        {children}
    </span>
)

export const Field = ({ label, error, hint, children }) => (
    <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">
            {label}
        </span>
        {children}
        {error ? (
            <span className="mt-1 block text-xs text-rose-600">{error}</span>
        ) : null}
        {hint ? (
            <span className="mt-1 block text-xs text-slate-400">{hint}</span>
        ) : null}
    </label>
)

const CONTROL =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"

export const Input = ({ className = "", ...props }) => (
    <input className={`${CONTROL} ${className}`} {...props} />
)

export const Textarea = ({ className = "", rows = 3, ...props }) => (
    <textarea className={`${CONTROL} ${className}`} rows={rows} {...props} />
)

export const Select = ({ className = "", children, ...props }) => (
    <select className={`${CONTROL} ${className}`} {...props}>
        {children}
    </select>
)

export const Spinner = ({ className = "" }) => (
    <span
        className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 ${className}`}
        role="status"
        aria-label="Loading"
    />
)

export const EmptyState = ({ title, hint, action }) => (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        {action}
    </div>
)

export const ErrorNote = ({ children }) =>
    children ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {children}
        </p>
    ) : null

export const Modal = ({ open, onClose, title, children, footer }) => {
    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
            onMouseDown={onClose}
        >
            <div
                className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
                {footer ? (
                    <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export const StatCard = ({ label, value, hint, tone = "slate" }) => {
    const tones = {
        slate: "text-slate-900",
        brand: "text-brand-600",
        amber: "text-amber-600",
        rose: "text-rose-600",
        emerald: "text-emerald-600",
    }

    return (
        <Card className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>
                {value}
            </p>
            {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </Card>
    )
}

export const Avatar = ({ person, className = "" }) => {
    const first = person?.firstName?.[0] || "?"
    const last = person?.lastName?.[0] || ""

    return (
        <span
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 ${className}`}
        >
            {(first + last).toUpperCase()}
        </span>
    )
}
