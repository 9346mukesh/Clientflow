import { useState } from "react"
import { useDispatch } from "react-redux"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useLoginMutation } from "../features/auth/authApi.js"
import { setCredentials } from "../features/auth/authSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import Brand from "../components/Brand.jsx"
import ThemeToggle from "../features/theme/ThemeToggle.jsx"
import {
    Button,
    Card,
    ErrorNote,
    Field,
    Input,
    PasswordInput,
} from "../components/ui.jsx"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"

const DEMO_ACCOUNTS = [
    { label: "Admin", email: "admin@agency.com" },
    { label: "Project Manager", email: "priya.pm@agency.com" },
    { label: "Developer", email: "ravi@agency.com" },
]

const DEMO_PASSWORD = "Password@123"

const SIGN_IN_POINTS = [
    "Role-scoped access — everyone sees exactly what they should.",
    "Live activity feed and notifications over WebSockets.",
    "Every change logged with who did it and when.",
]

const LoginPage = () => {
    useDocumentMeta(
        "Sign in",
        "Sign in to your ClientFlow workspace to manage clients, projects and tasks.",
    )

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from?.pathname || "/"

    const [login, { isLoading, error }] = useLoginMutation()
    const [form, setForm] = useState({ email: "", password: "" })
    const [fieldErrors, setFieldErrors] = useState({})

    const onChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setFieldErrors((current) => ({ ...current, [name]: undefined }))
    }

    // Validate before the request so mistakes are caught next to the field.
    const validate = () => {
        const errors = {}

        if (!form.email.trim()) {
            errors.email = "Enter your email address."
        } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
            errors.email = "That does not look like a valid email address."
        }

        if (!form.password) {
            errors.password = "Enter your password."
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!validate()) return

        try {
            const result = await login({
                email: form.email.trim(),
                password: form.password,
            }).unwrap()

            dispatch(
                setCredentials({
                    accessToken: result.accessToken,
                    user: result.data,
                }),
            )

            navigate(
                result.data.mustChangePassword ? "/change-password" : from,
                { replace: true },
            )
        } catch {
            // surfaced by the mutation result below
        }
    }

    const fillDemo = (email) =>
        setForm({ email, password: DEMO_PASSWORD })

    return (
        <div className="flex min-h-screen bg-page">
            {/* Statement column — desktop only */}
            <div className="hidden flex-1 flex-col justify-between border-r border-line bg-surface p-10 lg:flex">
                <Brand />

                <div className="max-w-md">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                        Client project dashboard
                    </p>
                    <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                        Every client, project and task — in one live view.
                    </h1>
                    <ul className="mt-6 space-y-3">
                        {SIGN_IN_POINTS.map((point) => (
                            <li
                                key={point}
                                className="flex gap-3 text-sm text-muted"
                            >
                                <span
                                    aria-hidden="true"
                                    className="mt-2 h-px w-4 shrink-0 bg-line-strong"
                                />
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                    Real-time · Role-based access · Audit trail
                </p>
            </div>

            {/* Form column */}
            <main className="relative flex flex-1 items-center justify-center px-4 py-12">
                <div className="absolute right-4 top-4">
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-sm">
                    <div className="mb-6 lg:hidden">
                        <Brand />
                    </div>

                    <Card className="p-6">
                        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                            Sign in
                        </h2>
                        <p className="mt-1 text-xs text-muted">
                            Use your agency account to continue.
                        </p>

                        <form
                            className="mt-5 space-y-4"
                            onSubmit={onSubmit}
                            noValidate
                        >
                            <Field
                                label="Email"
                                required
                                error={fieldErrors.email}
                            >
                                <Input
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    inputMode="email"
                                    value={form.email}
                                    onChange={onChange}
                                    invalid={Boolean(fieldErrors.email)}
                                    placeholder="you@agency.com"
                                />
                            </Field>

                            <Field
                                label="Password"
                                required
                                error={fieldErrors.password}
                            >
                                <PasswordInput
                                    name="password"
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={onChange}
                                    placeholder="••••••••"
                                />
                            </Field>

                            <ErrorNote>
                                {error ? errorMessage(error) : null}
                            </ErrorNote>

                            <Button
                                type="submit"
                                className="w-full"
                                loading={isLoading}
                            >
                                {isLoading ? "Signing in…" : "Sign in"}
                            </Button>
                        </form>

                        <details className="mt-5 border-t border-line pt-4">
                            <summary className="cursor-pointer text-xs font-medium text-muted transition-colors hover:text-ink">
                                Demo access
                            </summary>
                            <p className="mt-2 font-mono text-[11px] text-faint">
                                Password {DEMO_PASSWORD}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {DEMO_ACCOUNTS.map((account) => (
                                    <Button
                                        key={account.email}
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => fillDemo(account.email)}
                                    >
                                        {account.label}
                                    </Button>
                                ))}
                            </div>
                        </details>
                    </Card>

                    <p className="mt-6 text-center text-xs text-faint">
                        <Link
                            to="/privacy"
                            className="underline-offset-4 hover:text-ink hover:underline"
                        >
                            Privacy
                        </Link>
                        <span aria-hidden="true"> · </span>
                        <Link
                            to="/terms"
                            className="underline-offset-4 hover:text-ink hover:underline"
                        >
                            Terms
                        </Link>
                        <span aria-hidden="true"> · </span>
                        <Link
                            to="/cookies"
                            className="underline-offset-4 hover:text-ink hover:underline"
                        >
                            Cookies
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default LoginPage
