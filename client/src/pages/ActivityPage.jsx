import ActivityFeed from "../components/ActivityFeed.jsx"
import { PageHeader } from "../components/ui.jsx"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"

const ActivityPage = () => {
    useDocumentMeta(
        "Activity",
        "A live feed of every task change you are allowed to see in ClientFlow.",
    )

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Activity · live"
                title="Activity"
                description="Live feed of task changes you are allowed to see."
            />

            <ActivityFeed limit={50} title="Activity feed" />
        </div>
    )
}

export default ActivityPage
