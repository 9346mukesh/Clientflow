import { useState } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"

import {
    useCreateProjectMutation,
    useGetProjectsQuery,
} from "../features/projects/projectsApi.js"
import { useGetClientsQuery } from "../features/clients/clientsApi.js"
import { useGetUsersQuery } from "../features/users/usersApi.js"
import { errorMessage } from "../app/api/apiSlice.js"
import {
    PROJECT_STATUSES,
    PROJECT_STATUS_LABELS,
} from "../lib/constants.js"
import { fullName } from "../lib/format.js"
import { ProjectStatusBadge } from "../components/badges.jsx"
import {
    Button,
    Card,
    ErrorNote,
    Field,
    Input,
    Modal,
    Select,
    Textarea,
} from "../components/ui.jsx"

const emptyForm = {
    projectTitle: "",
    projectDescription: "",
    client: "",
    projectManager: "",
    status: "REQUIREMENT_ANALYSIS",
}

const ProjectsPage = () => {
    const role = useSelector((state) => state.auth.user?.role)
    const isAdmin = role === "ADMIN"

    const { data, isLoading } = useGetProjectsQuery()
    const { data: clientData } = useGetClientsQuery()
    const { data: pmData } = useGetUsersQuery(
        { role: "PROJECT_MANAGER", isActive: "true" },
        { skip: !isAdmin },
    )
    const [createProject, { isLoading: creating, error }] =
        useCreateProjectMutation()

    const [open, setOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)

    const projects = data?.data || []
    const clients = clientData?.data || []
    const managers = pmData?.data || []

    const onChange = (event) =>
        setForm((value) => ({
            ...value,
            [event.target.name]: event.target.value,
        }))

    const submit = async () => {
        try {
            const payload = { ...form }
            if (!isAdmin) delete payload.projectManager
            await createProject(payload).unwrap()
            setForm(emptyForm)
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
                        Projects
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isAdmin
                            ? "Every project in the agency."
                            : "Projects you manage."}
                    </p>
                </div>
                <Button onClick={() => setOpen(true)}>New project</Button>
            </div>

            {isLoading ? (
                <Card className="px-5 py-6 text-sm text-slate-500">
                    Loading projects…
                </Card>
            ) : projects.length === 0 ? (
                <Card className="px-5 py-6 text-sm text-slate-500">
                    No projects yet.
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            key={project._id}
                            to={`/projects/${project._id}`}
                            className="block"
                        >
                            <Card className="h-full p-5 transition hover:border-brand-300 hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        {project.projectTitle}
                                    </h2>
                                    <ProjectStatusBadge
                                        status={project.status}
                                    />
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                                    {project.projectDescription}
                                </p>
                                <div className="mt-4 space-y-1 text-xs text-slate-500">
                                    <p>
                                        Client ·{" "}
                                        <span className="text-slate-700">
                                            {project.client?.companyName || "—"}
                                        </span>
                                    </p>
                                    <p>
                                        Manager ·{" "}
                                        <span className="text-slate-700">
                                            {fullName(project.projectManager)}
                                        </span>
                                    </p>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="New project"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={
                                creating ||
                                !form.projectTitle ||
                                !form.client ||
                                (isAdmin && !form.projectManager)
                            }
                        >
                            {creating ? "Creating…" : "Create project"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Field label="Title">
                        <Input
                            name="projectTitle"
                            value={form.projectTitle}
                            onChange={onChange}
                        />
                    </Field>
                    <Field label="Description">
                        <Textarea
                            name="projectDescription"
                            value={form.projectDescription}
                            onChange={onChange}
                        />
                    </Field>
                    <Field label="Client">
                        <Select
                            name="client"
                            value={form.client}
                            onChange={onChange}
                        >
                            <option value="">Select client…</option>
                            {clients.map((client) => (
                                <option key={client._id} value={client._id}>
                                    {client.companyName} · {client.clientName}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    {isAdmin ? (
                        <Field
                            label="Project manager"
                            hint="PMs create and own their own projects"
                        >
                            <Select
                                name="projectManager"
                                value={form.projectManager}
                                onChange={onChange}
                            >
                                <option value="">Select manager…</option>
                                {managers.map((manager) => (
                                    <option
                                        key={manager._id}
                                        value={manager._id}
                                    >
                                        {fullName(manager)}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    ) : null}

                    <Field label="Status">
                        <Select
                            name="status"
                            value={form.status}
                            onChange={onChange}
                        >
                            {PROJECT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {PROJECT_STATUS_LABELS[status]}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <ErrorNote>{error ? errorMessage(error) : null}</ErrorNote>
                </div>
            </Modal>
        </div>
    )
}

export default ProjectsPage
