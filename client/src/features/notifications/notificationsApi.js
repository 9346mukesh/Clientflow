import { api, cleanParams } from "../../app/api/apiSlice.js"

export const notificationsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: (params) => ({
                url: "/notifications",
                params: cleanParams(params),
            }),
            providesTags: ["Notification"],
        }),
        getUnreadCount: builder.query({
            query: () => "/notifications/unread-count",
            providesTags: ["Notification"],
        }),
        markRead: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: "PATCH",
            }),
            invalidatesTags: ["Notification"],
        }),
        markAllRead: builder.mutation({
            query: () => ({
                url: "/notifications/read-all",
                method: "PATCH",
            }),
            invalidatesTags: ["Notification"],
        }),
    }),
})

export const {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkReadMutation,
    useMarkAllReadMutation,
} = notificationsApi
