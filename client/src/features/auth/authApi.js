import { api } from "../../app/api/apiSlice.js"

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
        }),
        changePassword: builder.mutation({
            query: (body) => ({
                url: "/auth/change-password",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["User"],
        }),
        getMe: builder.query({
            query: () => "/auth/me",
            providesTags: ["User"],
        }),
    }),
})

export const {
    useLoginMutation,
    useChangePasswordMutation,
    useGetMeQuery,
} = authApi
