import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { setAccessToken, loggedOut } from "../../features/auth/authSlice.js"

// every request carries the in-memory access token and the refresh cookie
const rawBaseQuery = fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.accessToken
        if (token) headers.set("authorization", `Bearer ${token}`)
        return headers
    },
})

// when an access token has expired, refresh once and replay the request
const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions)

    if (result.error?.status === 401) {
        const refreshed = await rawBaseQuery(
            { url: "/auth/refresh", method: "POST" },
            api,
            extraOptions,
        )

        if (refreshed.data?.accessToken) {
            api.dispatch(setAccessToken(refreshed.data.accessToken))
            result = await rawBaseQuery(args, api, extraOptions)
        } else {
            api.dispatch(loggedOut())
        }
    }

    return result
}

// strip empty filter values so they never reach the query string
export const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== "",
        ),
    )

export const api = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["User", "Client", "Project", "Task", "Activity", "Notification"],
    endpoints: () => ({}),
})

// a ready-made error message for any failed query
export const errorMessage = (error) =>
    error?.data?.message || error?.error || "Something went wrong"
