import { useState } from "react"
import { useDispatch } from "react-redux"

import { useCreateTaskMutation } from "../../features/tasks/tasksApi.js"
import { useGetDevelopersQuery } from "../../features/users/usersApi.js"
import { pushToast } from "../../features/ui/uiSlice.js"
import { errorMessage } from "../../app/api/apiSlice.js"
import { PRIORITY_LABELS, TASK_PRIORITIES } from "../../lib/constants.js"
import { fullName } from "../../lib/format.js"
import {
    Button,
    ErrorNote,
    Field,
    Input,
    Modal,
    Select,
    Textarea,
} from "../ui.jsx"

const emptyForm = {
    title: "",
    description: "",
    assignedTo: "",
    priority: "MEDIUM",
    dueDate: "",
}

const CreateTaskModal = ({ open, onClose, projectId }) => {
    const dispatch = useDispatch()

    const { data: devData } = useGetDevelopersQuery(undefined, {
        skip: !open,
    })
    const [createTask, { isLoading, error }] = useCreateTaskMutation()

    const [form, setForm] = useState(emptyForm)
    const [fieldErrors, setFieldErrors] = useState({})

    const developers = devData?.data || []

    const onChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setFieldErrors((current) => ({ ...current, [name]: undefined }))
    }

    // Every close path clears the draft, so reopening never shows stale input.
    const close = () => {
        setForm(emptyForm)
        setFieldErrors({})
        onClose()
    }

    const validate = () => {
        const errors = {}

        if (!form.title.trim()) errors.title = "Give the task a title."
        if (!form.assignedTo) errors.assignedTo = "Choose who will do this."
        if (!form.dueDate) errors.dueDate = "Set a due date."

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const submit = async () => {
        if (!validate()) return

        try {
            await createTask({ projectId, ...form }).unwrap()
            dispatch(pushToast({ message: "Task created." }))
            close()
        } catch (failure) {
            dispatch(
                pushToast({ tone: "error", message: errorMessage(failure) }),
            )
        }
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title="New task"
            description="The assignee is notified immediately."
            footer={
                <>
                    <Button variant="secondary" onClick={close}>
                        Cancel
                    </Button>
                    <Button onClick={submit} loading={isLoading}>
                        {isLoading ? "Creating…" : "Create task"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="Title" required error={fieldErrors.title}>
                    <Input
                        name="title"
                        value={form.title}
                        onChange={onChange}
                        invalid={Boolean(fieldErrors.title)}
                        placeholder="What needs to be done?"
                    />
                </Field>

                <Field label="Description">
                    <Textarea
                        name="description"
                        value={form.description}
                        onChange={onChange}
                        placeholder="Optional details"
                    />
                </Field>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field
                        label="Assignee"
                        required
                        error={fieldErrors.assignedTo}
                    >
                        <Select
                            name="assignedTo"
                            value={form.assignedTo}
                            onChange={onChange}
                            invalid={Boolean(fieldErrors.assignedTo)}
                        >
                            <option value="">Select developer…</option>
                            {developers.map((dev) => (
                                <option key={dev._id} value={dev._id}>
                                    {fullName(dev)}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Priority">
                        <Select
                            name="priority"
                            value={form.priority}
                            onChange={onChange}
                        >
                            {TASK_PRIORITIES.map((priority) => (
                                <option key={priority} value={priority}>
                                    {PRIORITY_LABELS[priority]}
                                </option>
                            ))}
                        </Select>
                    </Field>
                </div>

                <Field label="Due date" required error={fieldErrors.dueDate}>
                    <Input
                        name="dueDate"
                        type="date"
                        value={form.dueDate}
                        onChange={onChange}
                        invalid={Boolean(fieldErrors.dueDate)}
                    />
                </Field>

                <ErrorNote>{error ? errorMessage(error) : null}</ErrorNote>
            </div>
        </Modal>
    )
}

export default CreateTaskModal
