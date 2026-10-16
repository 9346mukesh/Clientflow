import { useState } from "react"
import { useDispatch } from "react-redux"
import { useSearchParams } from "react-router-dom"

import {
    useCreateUserMutation,
    useGetUsersQuery,
    useUpdateUserMutation,
} from "../features/users/usersApi.js"
import { pushToast } from "../features/ui/uiSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import { ROLE_LABELS } from "../lib/constants.js"
import { fullName } from "../lib/format.js"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"
import {
    Badge,
    Button,
    Card,
    EmptyState,
    ErrorNote,
    Field,
    Input,
    Modal,
    PageHeader,
    PasswordInput,
    Select,
    TableSkeleton,
} from "../components/ui.jsx"
import { IconSearch } from "../components/icons.jsx"

const ROLES = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]

const emptyCreate = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "DEVELOPER",
    jobTitle: "",
    gender: "",
}

// Weight, not hue: solid graphite for the widest role, then tint, then outline.
const ROLE_STYLES = {
    ADMIN: "bg-ink text-page ring-ink",
    PROJECT_MANAGER: "bg-surface-2 text-ink ring-line-strong",
    DEVELOPER: "bg-transparent text-muted ring-line",
}

const activeBadge = (isActive) =>
    isActive
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900"
        : "bg-surface-2 text-muted ring-line"

// A readable temporary password an admin can hand over.
const makePassword = () => {
    const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const bytes = new Uint32Array(12)
    crypto.getRandomValues(bytes)
    const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(
        "",
    )
    return `${body}@7`
}

const UsersPage = () => {
    useDocumentMeta(
        "Users",
        "Everyone with access to ClientFlow, their role and account status.",
    )

    const dispatch = useDispatch()
    const [params, setParams] = useSearchParams()

    const { data, isLoading } = useGetUsersQuery()
    const [createUser, { isLoading: creating, error: createError }] =
        useCreateUserMutation()
    const [updateUser] = useUpdateUserMutation()

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyCreate)
    const [fieldErrors, setFieldErrors] = useState({})

    const query = params.get("q") || ""
    const users = data?.data || []
    const needle = query.trim().toLowerCase()

    const visible = needle
        ? users.filter((user) =>
              [fullName(user), user.email, user.jobTitle]
                  .filter(Boolean)
                  .some((value) => value.toLowerCase().includes(needle)),
          )
        : users

    const setQuery = (value) => {
        const next = new URLSearchParams(params)
        if (value) next.set("q", value)
        else next.delete("q")
        setParams(next, { replace: true })
    }

    const onChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setFieldErrors((current) => ({ ...current, [name]: undefined }))
    }

    const openCreate = () => {
        setEditing(null)
        setForm(emptyCreate)
        setFieldErrors({})
        setOpen(true)
    }

    const openEdit = (user) => {
        setEditing(user)
        setForm({
            firstName: user.firstName,
            lastName: user.lastName || "",
            role: user.role,
            jobTitle: user.jobTitle || "",
            gender: user.gender || "",
        })
        setFieldErrors({})
        setOpen(true)
    }

    const close = () => {
        setOpen(false)
        setEditing(null)
        setForm(emptyCreate)
        setFieldErrors({})
    }

    const validate = () => {
        const errors = {}

        if (!form.firstName.trim()) errors.firstName = "Enter a first name."

        if (!editing) {
            if (!form.email.trim()) {
                errors.email = "Enter a work email address."
            } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
                errors.email = "That does not look like a valid email address."
            }

            if (!form.password) {
                errors.password = "Set a temporary password."
            } else if (form.password.length < 8) {
                errors.password = "Use at least 8 characters."
            }
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const submit = async () => {
        if (!validate()) return

        try {
            if (editing) {
                const { firstName, lastName, role, jobTitle, gender } = form
                await updateUser({
                    id: editing._id,
                    firstName,
                    lastName,
                    role,
                    jobTitle,
                    ...(gender ? { gender } : {}),
                }).unwrap()
                dispatch(pushToast({ message: "User updated." }))
            } else {
                const payload = { ...form }
                if (!payload.gender) delete payload.gender
                await createUser(payload).unwrap()
                dispatch(
                    pushToast({
                        message: "User created. Share the temporary password.",
                    }),
                )
            }
            close()
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    const toggleActive = async (user) => {
        try {
            await updateUser({
                id: user._id,
                isActive: !user.isActive,
            }).unwrap()
            dispatch(
                pushToast({
                    message: `${fullName(user)} ${
                        user.isActive ? "deactivated" : "activated"
                    }.`,
                }),
            )
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`People · ${String(users.length).padStart(2, "0")}`}
                title="Users"
                description="Everyone with access to ClientFlow."
                actions={<Button onClick={openCreate}>New user</Button>}
            />

            <div className="relative max-w-sm">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, email or job title"
                    aria-label="Search users"
                    className="pl-9"
                />
            </div>

            <Card>
                {isLoading ? (
                    <TableSkeleton rows={5} cols={4} />
                ) : visible.length === 0 ? (
                    <EmptyState
                        title={
                            needle ? "No people match that search" : "No users yet"
                        }
                        hint={
                            needle
                                ? "Try a different name, email or job title."
                                : "Invite the first teammate to get started."
                        }
                        action={
                            needle ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setQuery("")}
                                >
                                    Clear search
                                </Button>
                            ) : (
                                <Button size="sm" onClick={openCreate}>
                                    New user
                                </Button>
                            )
                        }
                    />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                                        <th scope="col" className="px-5 py-2.5 font-medium">
                                            Name
                                        </th>
                                        <th scope="col" className="px-5 py-2.5 font-medium">
                                            Role
                                        </th>
                                        <th scope="col" className="px-5 py-2.5 font-medium">
                                            Job title
                                        </th>
                                        <th scope="col" className="px-5 py-2.5 font-medium">
                                            Status
                                        </th>
                                        <th scope="col" className="px-5 py-2.5">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((user) => (
                                        <tr
                                            key={user._id}
                                            className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
                                        >
                                            <td className="px-5 py-3">
                                                <span className="block font-medium text-ink">
                                                    {fullName(user)}
                                                </span>
                                                <a
                                                    href={`mailto:${user.email}`}
                                                    className="text-xs text-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
                                                >
                                                    {user.email}
                                                </a>
                                            </td>
                                            <td className="px-5 py-3">
                                                <Badge className={ROLE_STYLES[user.role]}>
                                                    {ROLE_LABELS[user.role]}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 text-muted">
                                                {user.jobTitle || "—"}
                                            </td>
                                            <td className="px-5 py-3">
                                                <Badge className={activeBadge(user.isActive)}>
                                                    {user.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </Badge>
                                                {user.mustChangePassword ? (
                                                    <span className="ml-2 text-xs text-warning">
                                                        temp password
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(user)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant={
                                                        user.isActive
                                                            ? "dangerGhost"
                                                            : "ghost"
                                                    }
                                                    size="sm"
                                                    onClick={() => toggleActive(user)}
                                                >
                                                    {user.isActive
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="divide-y divide-line md:hidden">
                            {visible.map((user) => (
                                <li key={user._id} className="px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-ink">
                                                {fullName(user)}
                                            </p>
                                            <a
                                                href={`mailto:${user.email}`}
                                                className="text-xs text-faint underline-offset-4 hover:text-ink hover:underline"
                                            >
                                                {user.email}
                                            </a>
                                        </div>
                                        <Badge className={ROLE_STYLES[user.role]}>
                                            {ROLE_LABELS[user.role]}
                                        </Badge>
                                    </div>

                                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                                        <Badge className={activeBadge(user.isActive)}>
                                            {user.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </Badge>
                                        {user.jobTitle ? (
                                            <span className="text-muted">
                                                {user.jobTitle}
                                            </span>
                                        ) : null}
                                        {user.mustChangePassword ? (
                                            <span className="text-warning">
                                                temp password
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openEdit(user)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant={
                                                user.isActive
                                                    ? "dangerGhost"
                                                    : "ghost"
                                            }
                                            size="sm"
                                            onClick={() => toggleActive(user)}
                                        >
                                            {user.isActive
                                                ? "Deactivate"
                                                : "Activate"}
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Card>

            <Modal
                open={open}
                onClose={close}
                title={editing ? "Edit user" : "New user"}
                description={
                    editing
                        ? undefined
                        : "They will be asked to set their own password on first sign-in."
                }
                footer={
                    <>
                        <Button variant="secondary" onClick={close}>
                            Cancel
                        </Button>
                        <Button onClick={submit} loading={creating}>
                            {creating ? "Saving…" : "Save user"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field
                            label="First name"
                            required
                            error={fieldErrors.firstName}
                        >
                            <Input
                                name="firstName"
                                value={form.firstName}
                                onChange={onChange}
                                invalid={Boolean(fieldErrors.firstName)}
                            />
                        </Field>
                        <Field label="Last name">
                            <Input
                                name="lastName"
                                value={form.lastName}
                                onChange={onChange}
                            />
                        </Field>
                    </div>

                    {editing ? null : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field
                                label="Email"
                                required
                                error={fieldErrors.email}
                            >
                                <Input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={onChange}
                                    invalid={Boolean(fieldErrors.email)}
                                />
                            </Field>

                            <Field
                                label="Temporary password"
                                required
                                error={fieldErrors.password}
                                hint="At least 8 characters"
                            >
                                <div className="flex gap-2">
                                    <PasswordInput
                                        name="password"
                                        autoComplete="new-password"
                                        value={form.password}
                                        onChange={onChange}
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() =>
                                            setForm((current) => ({
                                                ...current,
                                                password: makePassword(),
                                            }))
                                        }
                                    >
                                        Generate
                                    </Button>
                                </div>
                            </Field>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Role">
                            <Select
                                name="role"
                                value={form.role}
                                onChange={onChange}
                            >
                                {ROLES.map((role) => (
                                    <option key={role} value={role}>
                                        {ROLE_LABELS[role]}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Job title">
                            <Input
                                name="jobTitle"
                                value={form.jobTitle}
                                onChange={onChange}
                            />
                        </Field>
                    </div>

                    <Field label="Gender" hint="Optional">
                        <Select
                            name="gender"
                            value={form.gender}
                            onChange={onChange}
                        >
                            <option value="">Prefer not to say</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </Select>
                    </Field>

                    <ErrorNote>
                        {createError ? errorMessage(createError) : null}
                    </ErrorNote>
                </div>
            </Modal>
        </div>
    )
}

export default UsersPage
