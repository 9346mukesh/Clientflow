import { createSlice } from "@reduxjs/toolkit"

// Live count of people online, pushed by the server over the socket.
const presenceSlice = createSlice({
    name: "presence",
    initialState: { onlineCount: 0 },
    reducers: {
        setOnlineCount: (state, action) => {
            state.onlineCount = action.payload
        },
    },
})

export const { setOnlineCount } = presenceSlice.actions
export const selectOnlineCount = (state) => state.presence.onlineCount
export default presenceSlice.reducer
