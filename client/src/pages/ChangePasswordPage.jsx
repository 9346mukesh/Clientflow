import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { useChangePasswordMutation } from "../features/auth/authApi.js"
import { setUser } from "../features/auth/authSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import { Button, Card, ErrorNote, Field, Input } from "../components/ui.jsx"

const ChangePasswordPage = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.auth.user)

    const [changePassword, { isLoading, error }] = useChangePasswordMutation()
    const [form, setForm] = useState({ currentPassword: "", newPassword: "" })
    const [done, setDone] = useState(false)

    const onChange = (event) =>
        setForm((value) => ({
            ...value,
            [event.target.name]: event.target.value,
        }))

    const onSubmit = async (event) => {
        event.preventDefault()

        try {
            await changePassword(form).unwrap()
            dispatch(setUser({ ...user, mustChangePassword: false }))
            setDone(true)
            setTimeout(() => navigate("/", { replace: true }), 800)
        } catch {
            // surfaced below
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
            <Card className="w-full max-w-sm p-6">
                <h1 className="text-base font-semibold text-slate-900">
                    Change password
                </h1>
                {user?.mustChangePassword ? (
                    <p className="mt-1 text-xs text-amber-600">
                        Your account was created with a temporary password.
                        Please choose a new one.
                    </p>
                ) : (
                    <p className="mt-1 text-xs text-slate-500">
                        Choose a new password for your account.
                    </p>
                )}

                <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                    <Field label="Current password">
                        <Input
                            name="currentPassword"
                            type="password"
                            required
                            value={form.currentPassword}
                            onChange={onChange}
                        />
                    </Field>

                    <Field
                        label="New password"
                        hint="At least 8 characters"
                    >
                        <Input
                            name="newPassword"
                            type="password"
                            required
                            minLength={8}
                            value={form.newPassword}
                            onChange={onChange}
                        />
                    </Field>

                    <ErrorNote>
                        {error ? errorMessage(error) : null}
                    </ErrorNote>

                    {done ? (
                        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                            Password updated. Redirecting…
                        </p>
                    ) : null}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || done}
                    >
                        {isLoading ? "Saving…" : "Update password"}
                    </Button>
                </form>
            </Card>
        </div>
    )
}

export default ChangePasswordPage
