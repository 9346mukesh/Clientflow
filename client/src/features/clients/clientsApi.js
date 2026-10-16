import { api, cleanParams } from "../../app/api/apiSlice.js"

export const clientsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getClients: builder.query({
            query: (params) => ({
                url: "/clients",
                params: cleanParams(params),
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map((c) => ({ type: "Client", id: c._id })),
                        { type: "Client", id: "LIST" },
                    ]
                    : [{ type: "Client", id: "LIST" }],
        }),
        createClient: builder.mutation({
            query: (body) => ({ url: "/clients", method: "POST", body }),
            invalidatesTags: ["Client"],
        }),
        updateClient: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/clients/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Client"],
        }),
        deactivateClient: builder.mutation({
            query: (id) => ({ url: `/clients/${id}`, method: "DELETE" }),
            invalidatesTags: ["Client"],
        }),
    }),
})

export const {
    useGetClientsQuery,
    useCreateClientMutation,
    useUpdateClientMutation,
    useDeactivateClientMutation,
} = clientsApi
