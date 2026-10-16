import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// The access token is kept in memory only. The refresh token lives in an
// HttpOnly cookie the JavaScript can never read, so a page reload recovers the
// session by asking the server to mint a fresh access token.
const initialState = {
    accessToken: null,
    user: null,
    status: "loading", // loading -> ready, once we know whether a session exists
    error: null,
}

export const bootstrapAuth = createAsyncThunk("auth/bootstrap", async () => {
    const refresh = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
    })

    if (!refresh.ok) return null

    const { accessToken } = await refresh.json()

    const me = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!me.ok) return null

    const { data } = await me.json()

    return { accessToken, user: data }
})

export const logoutUser = createAsyncThunk("auth/logout", async () => {
    await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
    })
})

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.accessToken = action.payload.accessToken
            state.user = action.payload.user
            state.status = "ready"
            state.error = null
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload
        },
        setUser: (state, action) => {
            state.user = action.payload
        },
        loggedOut: (state) => {
            state.accessToken = null
            state.user = null
            state.status = "ready"
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(bootstrapAuth.fulfilled, (state, action) => {
                state.status = "ready"
                if (action.payload) {
                    state.accessToken = action.payload.accessToken
                    state.user = action.payload.user
                }
            })
            .addCase(bootstrapAuth.rejected, (state) => {
                state.status = "ready"
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.accessToken = null
                state.user = null
            })
    },
})

export const { setCredentials, setAccessToken, setUser, loggedOut } =
    authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectRole = (state) => state.auth.user?.role
export const selectIsAuthed = (state) => Boolean(state.auth.accessToken)

export default authSlice.reducer
