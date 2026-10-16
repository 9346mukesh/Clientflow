import { useState } from "react"

import {
    useCreateClientMutation,
    useDeactivateClientMutation,
    useGetClientsQuery,
    useUpdateClientMutation,
} from "../features/clients/clientsApi.js"
import { errorMessage } from "../app/api/apiSlice.js"
import { Badge, Button, Card, ErrorNote, Field, Input, Modal } from "../components/ui.jsx"

const emptyForm = {
    clientName: "",
    companyName: "",
    email: "",
    phone: "",
}

const ClientsPage = () => {
    const { data, isLoading } = useGetClientsQuery()
    const [createClient, { isLoading: creating, error: createError }] =
        useCreateClientMutation()
    const [updateClient] = useUpdateClientMutation()
    const [deactivateClient] = useDeactivateClientMutation()

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyForm)

    const clients = data?.data || []

    const onChange = (event) =>
        setForm((value) => ({
            ...value,
            [event.target.name]: event.target.value,
        }))

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
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
        setOpen(true)
    }

    const submit = async () => {
        try {
            if (editing) {
                await updateClient({ id: editing._id, ...form }).unwrap()
            } else {
                await createClient(form).unwrap()
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
                        Clients
                    </h1>
                    <p className="text-sm text-slate-500">
                        Companies the agency works for.
                    </p>
                </div>
                <Button onClick={openCreate}>New client</Button>
            </div>

            <Card>
                {isLoading ? (
                    <p className="px-5 py-6 text-sm text-slate-500">
                        Loading clients…
                    </p>
                ) : clients.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">
                        No clients yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                                    <th className="px-5 py-2 font-medium">
                                        Client
                                    </th>
                                    <th className="px-5 py-2 font-medium">
                                        Company
                                    </th>
                                    <th className="px-5 py-2 font-medium">
                                        Contact
                                    </th>
                                    <th className="px-5 py-2 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client) => (
                                    <tr
                                        key={client._id}
                                        className="border-b border-slate-100"
                                    >
                                        <td className="px-5 py-3 font-medium text-slate-800">
                                            {client.clientName}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {client.companyName}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">
                                            <span className="block">
                                                {client.email}
                                            </span>
                                            {client.phone ? (
                                                <span className="text-xs text-slate-400">
                                                    {client.phone}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge
                                                className={
                                                    client.isActive
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                        : "bg-slate-100 text-slate-500 ring-slate-200"
                                                }
                                            >
                                                {client.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                onClick={() => openEdit(client)}
                                            >
                                                Edit
                                            </Button>
                                            {client.isActive ? (
                                                <Button
                                                    variant="ghost"
                                                    className="text-rose-600 hover:bg-rose-50"
                                                    onClick={() =>
                                                        deactivateClient(
                                                            client._id,
                                                        )
                                                    }
                                                >
                                                    Deactivate
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() =>
                                                        updateClient({
                                                            id: client._id,
                                                            isActive: true,
                                                        })
                                                    }
                                                >
                                                    Reactivate
                                                </Button>
                                            )}
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
                title={editing ? "Edit client" : "New client"}
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
                    <Field label="Client name">
                        <Input
                            name="clientName"
                            value={form.clientName}
                            onChange={onChange}
                        />
                    </Field>
                    <Field label="Company name">
                        <Input
                            name="companyName"
                            value={form.companyName}
                            onChange={onChange}
                        />
                    </Field>
                    <Field label="Email">
                        <Input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={onChange}
                        />
                    </Field>
                    <Field label="Phone">
                        <Input
                            name="phone"
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
