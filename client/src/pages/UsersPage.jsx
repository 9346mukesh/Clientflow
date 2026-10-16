import { useState } from "react"

import {
    useCreateUserMutation,
    useGetUsersQuery,
    useUpdateUserMutation,
} from "../features/users/usersApi.js"
import { errorMessage } from "../app/api/apiSlice.js"
import { ROLE_LABELS } from "../lib/constants.js"
import { fullName } from "../lib/format.js"
import {
    Badge,
    Button,
    Card,
    ErrorNote,
    Field,
    Input,
    Modal,
    Select,
} from "../components/ui.jsx"

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

const roleStyle = {
    ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
    PROJECT_MANAGER: "bg-blue-50 text-blue-700 ring-blue-200",
    DEVELOPER: "bg-slate-100 text-slate-600 ring-slate-200",
}

const UsersPage = () => {
    const { data, isLoading } = useGetUsersQuery()
    const [createUser, { isLoading: creating, error: createError }] =
        useCreateUserMutation()
    const [updateUser] = useUpdateUserMutation()

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyCreate)

    const users = data?.data || []

    const onChange = (event) =>
        setForm((value) => ({
            ...value,
            [event.target.name]: event.target.value,
        }))

    const openCreate = () => {
        setEditing(null)
        setForm(emptyCreate)
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
        setOpen(true)
    }

    const submit = async () => {
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
            } else {
                const payload = { ...form }
                if (!payload.gender) delete payload.gender
                await createUser(payload).unwrap()
            }
            setOpen(false)
        } catch {
            // surfaced below
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">
                        Users
                    </h1>
                    <p className="text-sm text-slate-500">
                        Everyone with access to ClientFlow.
                    </p>
                </div>
                <Button onClick={openCreate}>New user</Button>
            </div>

            <Card>
                {isLoading ? (
                    <p className="px-5 py-6 text-sm text-slate-500">
                        Loading users…
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                                    <th className="px-5 py-2 font-medium">
                                        Name
                                    </th>
                                    <th className="px-5 py-2 font-medium">
                                        Role
                                    </th>
                                    <th className="px-5 py-2 font-medium">
                                        Job title
                                    </th>
                                    <th className="px-5 py-2 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="border-b border-slate-100"
                                    >
                                        <td className="px-5 py-3">
                                            <span className="block font-medium text-slate-800">
                                                {fullName(user)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {user.email}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge
                                                className={roleStyle[user.role]}
                                            >
                                                {ROLE_LABELS[user.role]}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {user.jobTitle || "—"}
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge
                                                className={
                                                    user.isActive
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                        : "bg-slate-100 text-slate-500 ring-slate-200"
                                                }
                                            >
                                                {user.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                            {user.mustChangePassword ? (
                                                <span className="ml-2 text-xs text-amber-600">
                                                    temp password
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-5 py-3 text-right whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                onClick={() => openEdit(user)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className={
                                                    user.isActive
                                                        ? "text-rose-600 hover:bg-rose-50"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    updateUser({
                                                        id: user._id,
                                                        isActive:
                                                            !user.isActive,
                                                    })
                                                }
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
                )}
            </Card>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? "Edit user" : "New user"}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={submit} disabled={creating}>
                            {creating ? "Saving…" : "Save"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="First name">
                            <Input
                                name="firstName"
                                value={form.firstName}
                                onChange={onChange}
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
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Email">
                                <Input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={onChange}
                                />
                            </Field>
                            <Field
                                label="Temporary password"
                                hint="At least 8 characters"
                            >
                                <Input
                                    name="password"
                                    type="text"
                                    value={form.password}
                                    onChange={onChange}
                                />
                            </Field>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
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

                    <Field label="Gender">
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
