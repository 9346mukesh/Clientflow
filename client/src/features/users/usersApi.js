import { api, cleanParams } from "../../app/api/apiSlice.js"

export const usersApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: (params) => ({ url: "/users", params: cleanParams(params) }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map((u) => ({ type: "User", id: u._id })),
                        { type: "User", id: "LIST" },
                    ]
                    : [{ type: "User", id: "LIST" }],
        }),
        getDevelopers: builder.query({
            query: () => "/users/developers",
            providesTags: ["User"],
        }),
        createUser: builder.mutation({
            query: (body) => ({ url: "/users", method: "POST", body }),
            invalidatesTags: ["User"],
        }),
        updateUser: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/users/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["User"],
        }),
    }),
})

export const {
    useGetUsersQuery,
    useGetDevelopersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
} = usersApi
