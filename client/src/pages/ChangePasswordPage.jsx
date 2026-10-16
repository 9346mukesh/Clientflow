import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { useChangePasswordMutation } from "../features/auth/authApi.js"
import { setUser } from "../features/auth/authSlice.js"
import { pushToast } from "../features/ui/uiSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import Brand from "../components/Brand.jsx"
import ThemeToggle from "../features/theme/ThemeToggle.jsx"
import {
    Button,
    Card,
    ErrorNote,
    Field,
    PasswordInput,
} from "../components/ui.jsx"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"

const ChangePasswordPage = () => {
    useDocumentMeta("Change password")

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.auth.user)

    const [changePassword, { isLoading, error }] = useChangePasswordMutation()
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [fieldErrors, setFieldErrors] = useState({})
    const [done, setDone] = useState(false)

    const onChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setFieldErrors((current) => ({ ...current, [name]: undefined }))
    }

    const validate = () => {
        const errors = {}

        if (!form.currentPassword) {
            errors.currentPassword = "Enter your current password."
        }

        if (!form.newPassword) {
            errors.newPassword = "Choose a new password."
        } else if (form.newPassword.length < 8) {
            errors.newPassword = "Use at least 8 characters."
        } else if (form.newPassword === form.currentPassword) {
            errors.newPassword = "Choose a password you have not used here."
        }

        if (form.confirmPassword !== form.newPassword) {
            errors.confirmPassword = "The two passwords do not match."
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!validate()) return

        try {
            await changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            }).unwrap()

            dispatch(setUser({ ...user, mustChangePassword: false }))
            setDone(true)
            dispatch(
                pushToast({
                    message: "Password updated. Taking you to your dashboard…",
                }),
            )
            setTimeout(() => navigate("/", { replace: true }), 900)
        } catch {
            // surfaced below through the mutation result
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-page px-4 py-12">
            <div className="absolute right-4 top-4">
                <ThemeToggle />
            </div>

            <main className="w-full max-w-sm">
                <div className="mb-6 flex justify-center">
                    <Brand />
                </div>

                <Card className="p-6">
                    <h1 className="font-display text-lg font-semibold tracking-tight text-ink">
                        Change password
                    </h1>
                    {user?.mustChangePassword ? (
                        <p className="mt-1 text-xs text-warning">
                            Your account was created with a temporary password.
                            Please choose a new one.
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-muted">
                            Choose a new password for your account.
                        </p>
                    )}

                    <form
                        className="mt-5 space-y-4"
                        onSubmit={onSubmit}
                        noValidate
                    >
                        <Field
                            label="Current password"
                            required
                            error={fieldErrors.currentPassword}
                        >
                            <PasswordInput
                                name="currentPassword"
                                autoComplete="current-password"
                                value={form.currentPassword}
                                onChange={onChange}
                                invalid={Boolean(fieldErrors.currentPassword)}
                            />
                        </Field>

                        <Field
                            label="New password"
                            required
                            error={fieldErrors.newPassword}
                            hint="At least 8 characters"
                        >
                            <PasswordInput
                                name="newPassword"
                                autoComplete="new-password"
                                minLength={8}
                                value={form.newPassword}
                                onChange={onChange}
                                invalid={Boolean(fieldErrors.newPassword)}
                            />
                        </Field>

                        <Field
                            label="Confirm new password"
                            required
                            error={fieldErrors.confirmPassword}
                        >
                            <PasswordInput
                                name="confirmPassword"
                                autoComplete="new-password"
                                value={form.confirmPassword}
                                onChange={onChange}
                                invalid={Boolean(fieldErrors.confirmPassword)}
                            />
                        </Field>

                        <ErrorNote>
                            {error ? errorMessage(error) : null}
                        </ErrorNote>

                        {done ? (
                            <p
                                role="status"
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                            >
                                Password updated. Redirecting…
                            </p>
                        ) : null}

                        <Button
                            type="submit"
                            className="w-full"
                            loading={isLoading}
                            disabled={done}
                        >
                            {isLoading ? "Saving…" : "Update password"}
                        </Button>
                    </form>
                </Card>
            </main>
        </div>
    )
}

export default ChangePasswordPage
