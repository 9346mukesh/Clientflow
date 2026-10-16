import { createSlice } from "@reduxjs/toolkit"

// Unread count comes from the API on load and then from the socket in real time.
// `live` holds the newest notifications pushed over the socket so the dropdown
// updates without a refetch.
const initialState = {
    unreadCount: 0,
    live: [],
}

const notificationsSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload
        },
        pushNotification: (state, action) => {
            const { notification, unreadCount } = action.payload

            if (notification && !state.live.some((n) => n._id === notification._id)) {
                state.live.unshift(notification)
                state.live = state.live.slice(0, 30)
            }

            if (typeof unreadCount === "number") {
                state.unreadCount = unreadCount
            } else if (notification && !notification.isRead) {
                state.unreadCount += 1
            }
        },
        clearLive: (state) => {
            state.live = []
        },
    },
})

export const { setUnreadCount, pushNotification, clearLive } =
    notificationsSlice.actions

export default notificationsSlice.reducer
