import { useState } from "react"
import { useDispatch } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"

import { useLoginMutation } from "../features/auth/authApi.js"
import { setCredentials } from "../features/auth/authSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import { Button, Card, ErrorNote, Field, Input } from "../components/ui.jsx"

const DEMO = [
    { label: "Admin", email: "admin@agency.com" },
    { label: "Project Manager", email: "priya.pm@agency.com" },
    { label: "Developer", email: "ravi@agency.com" },
]

const LoginPage = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from?.pathname || "/"

    const [login, { isLoading, error }] = useLoginMutation()
    const [form, setForm] = useState({ email: "", password: "" })

    const onChange = (event) =>
        setForm((value) => ({
            ...value,
            [event.target.name]: event.target.value,
        }))

    const onSubmit = async (event) => {
        event.preventDefault()

        try {
            const result = await login(form).unwrap()
            dispatch(
                setCredentials({
                    accessToken: result.accessToken,
                    user: result.data,
                }),
            )
            navigate(result.data.mustChangePassword ? "/change-password" : from, {
                replace: true,
            })
        } catch {
            // the error is surfaced below through the mutation result
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex items-center justify-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                        CF
                    </span>
                    <span className="text-lg font-semibold text-white">
                        ClientFlow
                    </span>
                </div>

                <Card className="p-6">
                    <h1 className="text-base font-semibold text-slate-900">
                        Sign in
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        Use your agency account to continue.
                    </p>

                    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                        <Field label="Email">
                            <Input
                                name="email"
                                type="email"
                                autoComplete="username"
                                required
                                value={form.email}
                                onChange={onChange}
                                placeholder="you@agency.com"
                            />
                        </Field>

                        <Field label="Password">
                            <Input
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={form.password}
                                onChange={onChange}
                                placeholder="••••••••"
                            />
                        </Field>

                        <ErrorNote>{error ? errorMessage(error) : null}</ErrorNote>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in…" : "Sign in"}
                        </Button>
                    </form>
                </Card>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Demo accounts · Password@123
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {DEMO.map((account) => (
                            <button
                                key={account.email}
                                type="button"
                                onClick={() =>
                                    setForm({
                                        email: account.email,
                                        password: "Password@123",
                                    })
                                }
                                className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/20"
                            >
                                {account.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
