import { useSelector } from "react-redux"

import AdminDashboard from "../features/dashboard/AdminDashboard.jsx"
import PmDashboard from "../features/dashboard/PmDashboard.jsx"
import DevDashboard from "../features/dashboard/DevDashboard.jsx"

const DashboardPage = () => {
    const role = useSelector((state) => state.auth.user?.role)

    if (role === "ADMIN") return <AdminDashboard />
    if (role === "PROJECT_MANAGER") return <PmDashboard />
    return <DevDashboard />
}

export default DashboardPage
