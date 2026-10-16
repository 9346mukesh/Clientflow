import ActivityFeed from "../components/ActivityFeed.jsx"

const ActivityPage = () => (
    <div className="space-y-5">
        <div>
            <h1 className="text-lg font-semibold text-slate-900">Activity</h1>
            <p className="text-sm text-slate-500">
                Live feed of task changes you are allowed to see.
            </p>
        </div>

        <ActivityFeed limit={50} title="Activity feed" />
    </div>
)

export default ActivityPage
