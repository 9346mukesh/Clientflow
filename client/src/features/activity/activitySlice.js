import { createSlice } from "@reduxjs/toolkit"

// Rows pushed over the socket, newest first. The feed merges these with the
// rows it fetches from the database so nothing is shown twice.
const initialState = {
    live: [],
}

const activitySlice = createSlice({
    name: "activity",
    initialState,
    reducers: {
        pushActivity: (state, action) => {
            const row = action.payload
            if (!row?._id) return
            if (state.live.some((r) => r._id === row._id)) return

            state.live.unshift(row)
            state.live = state.live.slice(0, 50)
        },
        pushActivities: (state, action) => {
            const rows = action.payload || []
            const seen = new Set(state.live.map((r) => r._id))
            const merged = [...state.live]

            for (const row of rows) {
                if (row?._id && !seen.has(row._id)) {
                    merged.push(row)
                    seen.add(row._id)
                }
            }

            merged.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            )
            state.live = merged.slice(0, 50)
        },
        clearActivity: (state) => {
            state.live = []
        },
    },
})

export const { pushActivity, pushActivities, clearActivity } =
    activitySlice.actions

export default activitySlice.reducer
