import { useState } from "react"
import { useDispatch } from "react-redux"
import { useSearchParams } from "react-router-dom"

import {
    useCreateClientMutation,
    useDeactivateClientMutation,
    useGetClientsQuery,
    useUpdateClientMutation,
} from "../features/clients/clientsApi.js"
import { pushToast } from "../features/ui/uiSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
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
    TableSkeleton,
} from "../components/ui.jsx"
import { IconMail, IconSearch } from "../components/icons.jsx"

const emptyForm = {
    clientName: "",
    companyName: "",
    email: "",
    phone: "",
}

const statusBadge = (isActive) =>
    isActive
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900"
        : "bg-surface-2 text-muted ring-line"

const ClientsPage = () => {
    useDocumentMeta(
        "Clients",
        "The companies your agency works for, with primary contacts.",
    )

    const dispatch = useDispatch()
    const [params, setParams] = useSearchParams()

    const { data, isLoading } = useGetClientsQuery()
    const [createClient, { isLoading: creating, error: createError }] =
        useCreateClientMutation()
    const [updateClient] = useUpdateClientMutation()
    const [deactivateClient] = useDeactivateClientMutation()

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [fieldErrors, setFieldErrors] = useState({})

    // The URL holds the search term so a shared link opens on the same view.
    const query = params.get("q") || ""

    const clients = data?.data || []
    const needle = query.trim().toLowerCase()

    const visible = needle
        ? clients.filter((client) =>
              [client.clientName, client.companyName, client.email]
                  .filter(Boolean)
                  .some((value) => value.toLowerCase().includes(needle)),
          )
        : clients

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
        setForm(emptyForm)
        setFieldErrors({})
        setOpen(true)
    }

    const openEdit = (client) => {
        setEditing(client)
        setForm({
            clientName: client.clientName,
            companyName: client.companyName,
            email: client.email,
            phone: client.phone || "",
        })
        setFieldErrors({})
        setOpen(true)
    }

    const close = () => {
        setOpen(false)
        setEditing(null)
        setForm(emptyForm)
        setFieldErrors({})
    }

    const validate = () => {
        const errors = {}

        if (!form.clientName.trim()) {
            errors.clientName = "Enter the contact's name."
        }
        if (!form.companyName.trim()) {
            errors.companyName = "Enter the company name."
        }
        if (!form.email.trim()) {
            errors.email = "Enter an email address."
        } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
            errors.email = "That does not look like a valid email address."
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const submit = async () => {
        if (!validate()) return

        try {
            if (editing) {
                await updateClient({ id: editing._id, ...form }).unwrap()
                dispatch(pushToast({ message: "Client updated." }))
            } else {
                await createClient(form).unwrap()
                dispatch(pushToast({ message: "Client created." }))
            }
            close()
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    const toggleActive = async (client) => {
        try {
            if (client.isActive) {
                await deactivateClient(client._id).unwrap()
                dispatch(
                    pushToast({ message: `${client.clientName} deactivated.` }),
                )
            } else {
                await updateClient({
                    id: client._id,
                    isActive: true,
                }).unwrap()
                dispatch(
                    pushToast({ message: `${client.clientName} reactivated.` }),
                )
            }
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Clients · ${String(clients.length).padStart(2, "0")}`}
                title="Clients"
                description="Companies the agency works for."
                actions={<Button onClick={openCreate}>New client</Button>}
            />

            <div className="relative max-w-sm">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, company or email"
                    aria-label="Search clients"
                    className="pl-9"
                />
            </div>

            <Card>
                {isLoading ? (
                    <TableSkeleton rows={4} cols={4} />
                ) : visible.length === 0 ? (
                    <EmptyState
                        title={
                            needle
                                ? "No clients match that search"
                                : "No clients yet"
                        }
                        hint={
                            needle
                                ? "Try a different name, company or email."
                                : "Add the first client to start creating projects."
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
                                    New client
                                </Button>
                            )
                        }
                    />
                ) : (
                    <>
                        {/* Table from md up */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                                        <th scope="col" className="px-5 py-2.5 font-medium">
                                            Client
                                        </th>
                                        <th scope="col" className="px-5 py-2.5 font-medium">
                                            Company
                                        </th>
                                        <th scope="col" className="px-5 py-2.5 font-medium">
                                            Contact
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
                                    {visible.map((client) => (
                                        <tr
                                            key={client._id}
                                            className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
                                        >
                                            <td className="px-5 py-3 font-medium text-ink">
                                                {client.clientName}
                                            </td>
                                            <td className="px-5 py-3 text-muted">
                                                {client.companyName}
                                            </td>
                                            <td className="px-5 py-3">
                                                <a
                                                    href={`mailto:${client.email}`}
                                                    className="block text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                                                >
                                                    {client.email}
                                                </a>
                                                {client.phone ? (
                                                    // min-h-6 keeps the tap target at
                                                    // the 24px minimum.
                                                    <a
                                                        href={`tel:${client.phone}`}
                                                        className="inline-flex min-h-6 items-center text-xs text-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
                                                    >
                                                        {client.phone}
                                                    </a>
                                                ) : null}
                                            </td>
                                            <td className="px-5 py-3">
                                                <Badge className={statusBadge(client.isActive)}>
                                                    {client.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </Badge>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(client)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant={
                                                        client.isActive
                                                            ? "dangerGhost"
                                                            : "ghost"
                                                    }
                                                    size="sm"
                                                    onClick={() => toggleActive(client)}
                                                >
                                                    {client.isActive
                                                        ? "Deactivate"
                                                        : "Reactivate"}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards below md */}
                        <ul className="divide-y divide-line md:hidden">
                            {visible.map((client) => (
                                <li key={client._id} className="px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-ink">
                                                {client.clientName}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {client.companyName}
                                            </p>
                                        </div>
                                        <Badge className={statusBadge(client.isActive)}>
                                            {client.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </Badge>
                                    </div>

                                    <div className="mt-2.5 flex flex-col gap-1 text-xs">
                                        <a
                                            href={`mailto:${client.email}`}
                                            className="inline-flex min-h-6 items-center gap-1.5 text-muted underline-offset-4 hover:text-ink hover:underline"
                                        >
                                            <IconMail className="h-3.5 w-3.5" />
                                            {client.email}
                                        </a>
                                        {client.phone ? (
                                            <a
                                                href={`tel:${client.phone}`}
                                                className="inline-flex min-h-6 items-center text-faint underline-offset-4 hover:text-ink hover:underline"
                                            >
                                                {client.phone}
                                            </a>
                                        ) : null}
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openEdit(client)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant={
                                                client.isActive
                                                    ? "dangerGhost"
                                                    : "ghost"
                                            }
                                            size="sm"
                                            onClick={() => toggleActive(client)}
                                        >
                                            {client.isActive
                                                ? "Deactivate"
                                                : "Reactivate"}
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
                title={editing ? "Edit client" : "New client"}
                footer={
                    <>
                        <Button variant="secondary" onClick={close}>
                            Cancel
                        </Button>
                        <Button onClick={submit} loading={creating}>
                            {creating ? "Saving…" : "Save client"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Field
                        label="Client name"
                        required
                        error={fieldErrors.clientName}
                    >
                        <Input
                            name="clientName"
                            value={form.clientName}
                            onChange={onChange}
                            invalid={Boolean(fieldErrors.clientName)}
                        />
                    </Field>

                    <Field
                        label="Company name"
                        required
                        error={fieldErrors.companyName}
                    >
                        <Input
                            name="companyName"
                            value={form.companyName}
                            onChange={onChange}
                            invalid={Boolean(fieldErrors.companyName)}
                        />
                    </Field>

                    <Field
                        label="Email"
                        required
                        error={fieldErrors.email}
                        hint="Used for project correspondence"
                    >
                        <Input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={onChange}
                            invalid={Boolean(fieldErrors.email)}
                        />
                    </Field>

                    <Field label="Phone" hint="Optional">
                        <Input
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={onChange}
                        />
                    </Field>

                    <ErrorNote>
                        {createError ? errorMessage(createError) : null}
                    </ErrorNote>
                </div>
            </Modal>
        </div>
    )
}

export default ClientsPage
