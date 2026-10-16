import { api, cleanParams } from "../../app/api/apiSlice.js"

export const tasksApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTasks: builder.query({
            query: (params) => ({
                url: "/tasks",
                params: cleanParams(params),
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map((t) => ({ type: "Task", id: t._id })),
                        { type: "Task", id: "LIST" },
                    ]
                    : [{ type: "Task", id: "LIST" }],
        }),
        getTask: builder.query({
            query: (id) => `/tasks/${id}`,
            providesTags: (result, error, id) => [{ type: "Task", id }],
        }),
        createTask: builder.mutation({
            query: ({ projectId, ...body }) => ({
                url: `/projects/${projectId}/tasks`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Task", "Project"],
        }),
        updateTask: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/tasks/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Task", id },
                { type: "Task", id: "LIST" },
            ],
        }),
        updateTaskStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/tasks/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Task", id },
                { type: "Task", id: "LIST" },
                "Activity",
            ],
        }),
        deleteTask: builder.mutation({
            query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
            invalidatesTags: ["Task", "Project"],
        }),
        getTaskActivity: builder.query({
            query: ({ id, limit = 50 }) => ({
                url: `/tasks/${id}/activity`,
                params: { limit },
            }),
            providesTags: (result, error, { id }) => [
                { type: "Activity", id },
            ],
        }),
    }),
})

export const {
    useGetTasksQuery,
    useGetTaskQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useUpdateTaskStatusMutation,
    useDeleteTaskMutation,
    useGetTaskActivityQuery,
} = tasksApi
