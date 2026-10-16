import { configureStore } from "@reduxjs/toolkit"

import { api } from "./api/apiSlice.js"
import authReducer from "../features/auth/authSlice.js"
import notificationsReducer from "../features/notifications/notificationsSlice.js"
import activityReducer from "../features/activity/activitySlice.js"
import presenceReducer from "../features/presence/presenceSlice.js"
import themeReducer from "../features/theme/themeSlice.js"
import uiReducer from "../features/ui/uiSlice.js"

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
        auth: authReducer,
        notifications: notificationsReducer,
        activity: activityReducer,
        presence: presenceReducer,
        theme: themeReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
})
