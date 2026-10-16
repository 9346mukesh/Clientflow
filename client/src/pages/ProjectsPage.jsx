import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"

import {
    useCreateProjectMutation,
    useGetProjectsQuery,
} from "../features/projects/projectsApi.js"
import { useGetClientsQuery } from "../features/clients/clientsApi.js"
import { useGetUsersQuery } from "../features/users/usersApi.js"
import { pushToast } from "../features/ui/uiSlice.js"
import { errorMessage } from "../app/api/apiSlice.js"
import {
    PROJECT_STATUSES,
    PROJECT_STATUS_LABELS,
} from "../lib/constants.js"
import { fullName } from "../lib/format.js"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"
import { ProjectStatusBadge } from "../components/badges.jsx"
import {
    Button,
    Card,
    CardsSkeleton,
    EmptyState,
    ErrorNote,
    Field,
    Input,
    Modal,
    PageHeader,
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
    useDocumentMeta(
        "Projects",
        "Every project you have access to, with client, manager and current stage.",
    )

    const dispatch = useDispatch()
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
    const [fieldErrors, setFieldErrors] = useState({})

    const projects = data?.data || []
    const clients = clientData?.data || []
    const managers = pmData?.data || []

    const onChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setFieldErrors((current) => ({ ...current, [name]: undefined }))
    }

    const openCreate = () => {
        setForm(emptyForm)
        setFieldErrors({})
        setOpen(true)
    }

    const close = () => {
        setForm(emptyForm)
        setFieldErrors({})
        setOpen(false)
    }

    const validate = () => {
        const errors = {}

        if (!form.projectTitle.trim()) {
            errors.projectTitle = "Give the project a title."
        }
        if (!form.projectDescription.trim()) {
            errors.projectDescription = "Add a short description."
        }
        if (!form.client) errors.client = "Choose the client."
        if (isAdmin && !form.projectManager) {
            errors.projectManager = "Choose the project manager."
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const submit = async () => {
        if (!validate()) return

        try {
            const payload = { ...form }
            if (!isAdmin) delete payload.projectManager

            await createProject(payload).unwrap()
            dispatch(pushToast({ message: "Project created." }))
            close()
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Projects · ${String(projects.length).padStart(2, "0")}`}
                title="Projects"
                description={
                    isAdmin
                        ? "Every project in the agency."
                        : "Projects you manage."
                }
                actions={<Button onClick={openCreate}>New project</Button>}
            />

            {isLoading ? (
                <CardsSkeleton count={6} />
            ) : projects.length === 0 ? (
                <Card>
                    <EmptyState
                        title="No projects yet"
                        hint="Create the first project to get the board moving."
                        action={<Button onClick={openCreate}>New project</Button>}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            key={project._id}
                            to={`/projects/${project._id}`}
                            className="block rounded-xl focus-visible:outline-none"
                        >
                            <Card className="h-full p-5 transition-colors hover:border-line-strong hover:bg-surface-2">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="font-display text-sm font-semibold tracking-tight text-ink">
                                        {project.projectTitle}
                                    </h2>
                                    <ProjectStatusBadge
                                        status={project.status}
                                    />
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                                    {project.projectDescription}
                                </p>
                                <div className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
                                    <p>
                                        <span className="text-faint">
                                            Client
                                        </span>{" "}
                                        {project.client?.companyName || "—"}
                                    </p>
                                    <p>
                                        <span className="text-faint">
                                            Manager
                                        </span>{" "}
                                        {fullName(project.projectManager)}
                                    </p>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <Modal
                open={open}
                onClose={close}
                title="New project"
                description="Projects start at requirement analysis."
                footer={
                    <>
                        <Button variant="secondary" onClick={close}>
                            Cancel
                        </Button>
                        <Button onClick={submit} loading={creating}>
                            {creating ? "Creating…" : "Create project"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Field
                        label="Title"
                        required
                        error={fieldErrors.projectTitle}
                    >
                        <Input
                            name="projectTitle"
                            value={form.projectTitle}
                            onChange={onChange}
                            invalid={Boolean(fieldErrors.projectTitle)}
                        />
                    </Field>

                    <Field
                        label="Description"
                        required
                        error={fieldErrors.projectDescription}
                    >
                        <Textarea
                            name="projectDescription"
                            value={form.projectDescription}
                            onChange={onChange}
                            invalid={Boolean(fieldErrors.projectDescription)}
                        />
                    </Field>

                    <Field label="Client" required error={fieldErrors.client}>
                        <Select
                            name="client"
                            value={form.client}
                            onChange={onChange}
                            invalid={Boolean(fieldErrors.client)}
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
                            required
                            error={fieldErrors.projectManager}
                            hint="PMs create and own their own projects"
                        >
                            <Select
                                name="projectManager"
                                value={form.projectManager}
                                onChange={onChange}
                                invalid={Boolean(fieldErrors.projectManager)}
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
