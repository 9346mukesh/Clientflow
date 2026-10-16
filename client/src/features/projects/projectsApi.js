import { api, cleanParams } from "../../app/api/apiSlice.js"

export const projectsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProjects: builder.query({
            query: (params) => ({
                url: "/projects",
                params: cleanParams(params),
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map((p) => ({ type: "Project", id: p._id })),
                        { type: "Project", id: "LIST" },
                    ]
                    : [{ type: "Project", id: "LIST" }],
        }),
        getProject: builder.query({
            query: (id) => `/projects/${id}`,
            providesTags: (result, error, id) => [{ type: "Project", id }],
        }),
        createProject: builder.mutation({
            query: (body) => ({ url: "/projects", method: "POST", body }),
            invalidatesTags: ["Project"],
        }),
        updateProject: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/projects/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Project", id },
                { type: "Project", id: "LIST" },
            ],
        }),
        deleteProject: builder.mutation({
            query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
            invalidatesTags: ["Project"],
        }),
    }),
})

export const {
    useGetProjectsQuery,
    useGetProjectQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,
} = projectsApi
