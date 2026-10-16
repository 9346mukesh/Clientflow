import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Navigate, Route, Routes } from "react-router-dom"

import { bootstrapAuth } from "./features/auth/authSlice.js"
import { ProtectedRoute, Splash } from "./components/auth-guards.jsx"
import AppLayout from "./components/Layout.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx"
import DashboardPage from "./pages/DashboardPage.jsx"
import ProjectsPage from "./pages/ProjectsPage.jsx"
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx"
import TasksPage from "./pages/TasksPage.jsx"
import ClientsPage from "./pages/ClientsPage.jsx"
import UsersPage from "./pages/UsersPage.jsx"
import ActivityPage from "./pages/ActivityPage.jsx"
import NotFoundPage from "./pages/NotFoundPage.jsx"

const App = () => {
    const dispatch = useDispatch()
    const status = useSelector((state) => state.auth.status)
    const isAuthed = useSelector((state) => Boolean(state.auth.accessToken))

    // on first load, try to recover the session from the refresh cookie
    useEffect(() => {
        dispatch(bootstrapAuth())
    }, [dispatch])

    if (status === "loading") return <Splash />

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthed ? <Navigate to="/" replace /> : <LoginPage />
                }
            />

            <Route
                path="/change-password"
                element={
                    <ProtectedRoute>
                        <ChangePasswordPage />
                    </ProtectedRoute>
                }
            />

            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />

                <Route
                    path="projects"
                    element={
                        <ProtectedRoute roles={["ADMIN", "PROJECT_MANAGER"]}>
                            <ProjectsPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="projects/:id" element={<ProjectDetailPage />} />

                <Route path="tasks" element={<TasksPage />} />

                <Route
                    path="clients"
                    element={
                        <ProtectedRoute roles={["ADMIN"]}>
                            <ClientsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="users"
                    element={
                        <ProtectedRoute roles={["ADMIN"]}>
                            <UsersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="activity"
                    element={
                        <ProtectedRoute roles={["ADMIN", "PROJECT_MANAGER"]}>
                            <ActivityPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    )
}

export default App
