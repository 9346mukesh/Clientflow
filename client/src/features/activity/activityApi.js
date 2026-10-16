import { api, cleanParams } from "../../app/api/apiSlice.js"

export const activityApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getActivity: builder.query({
            query: (params) => ({
                url: "/activity",
                params: cleanParams(params),
            }),
            providesTags: ["Activity"],
        }),
    }),
})

export const { useGetActivityQuery } = activityApi
