import { useState } from "react"

import { useCreateTaskMutation } from "../../features/tasks/tasksApi.js"
import { useGetDevelopersQuery } from "../../features/users/usersApi.js"
import { errorMessage } from "../../app/api/apiSlice.js"
import {
    TASK_PRIORITIES,
    PRIORITY_LABELS,
} from "../../lib/constants.js"
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
    const { data: devData } = useGetDevelopersQuery(undefined, {
        skip: !open,
    })
    const [createTask, { isLoading, error }] = useCreateTaskMutation()
    const [form, setForm] = useState(emptyForm)

    const developers = devData?.data || []

    const onChange = (event) =>
        setForm((value) => ({
            ...value,
            [event.target.name]: event.target.value,
        }))

    const submit = async () => {
        try {
            await createTask({ projectId, ...form }).unwrap()
            setForm(emptyForm)
            onClose()
        } catch {
            // surfaced below
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="New task"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={
                            isLoading ||
                            !form.title ||
                            !form.assignedTo ||
                            !form.dueDate
                        }
                    >
                        {isLoading ? "Creating…" : "Create task"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="Title">
                    <Input
                        name="title"
                        value={form.title}
                        onChange={onChange}
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

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Assignee">
                        <Select
                            name="assignedTo"
                            value={form.assignedTo}
                            onChange={onChange}
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

                <Field label="Due date">
                    <Input
                        name="dueDate"
                        type="date"
                        value={form.dueDate}
                        onChange={onChange}
                    />
                </Field>

                <ErrorNote>{error ? errorMessage(error) : null}</ErrorNote>
            </div>
        </Modal>
    )
}

export default CreateTaskModal
