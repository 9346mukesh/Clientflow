import { createSlice } from "@reduxjs/toolkit"

export const THEME_STORAGE_KEY = "clientflow-theme"

// The inline script in index.html stamps `dark` on <html> before first paint.
// Reading it back here keeps Redux and the DOM in agreement from the start,
// so the toggle never disagrees with what the user is looking at.
const readInitialMode = () => {
    if (typeof document === "undefined") return "light"
    return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light"
}

const themeSlice = createSlice({
    name: "theme",
    initialState: { mode: readInitialMode() },
    reducers: {
        toggleTheme: (state) => {
            state.mode = state.mode === "dark" ? "light" : "dark"
        },
        setTheme: (state, action) => {
            state.mode = action.payload === "dark" ? "dark" : "light"
        },
    },
})

export const { toggleTheme, setTheme } = themeSlice.actions
export default themeSlice.reducer
