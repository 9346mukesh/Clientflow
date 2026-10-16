import { createSlice, nanoid } from "@reduxjs/toolkit"

export const COOKIE_CONSENT_KEY = "clientflow-cookie-consent"

const readCookieConsent = () => {
    if (typeof localStorage === "undefined") return null
    try {
        return localStorage.getItem(COOKIE_CONSENT_KEY)
    } catch {
        // private mode: behave as if the banner was already dismissed
        return "unavailable"
    }
}

const uiSlice = createSlice({
    name: "ui",
    initialState: {
        toasts: [],
        cookieConsent: readCookieConsent(),
    },
    reducers: {
        // Success/error feedback. `prepare` mints the id so callers stay terse.
        pushToast: {
            reducer: (state, action) => {
                state.toasts.push(action.payload)
            },
            prepare: (toast) => ({
                payload: {
                    id: nanoid(),
                    tone: "success",
                    ...(typeof toast === "string" ? { message: toast } : toast),
                },
            }),
        },
        dismissToast: (state, action) => {
            state.toasts = state.toasts.filter(
                (toast) => toast.id !== action.payload,
            )
        },
        setCookieConsent: (state, action) => {
            state.cookieConsent = action.payload
        },
    },
})

export const { pushToast, dismissToast, setCookieConsent } = uiSlice.actions
export default uiSlice.reducer
