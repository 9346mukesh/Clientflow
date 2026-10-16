import "dotenv/config"
import mongoose from "mongoose"
import bcrypt from "bcrypt"

import User from "./models/user.model.js"
import Client from "./models/client.model.js"
import Project from "./models/project.model.js"
import Task from "./models/task.model.js"
import ActivityLog from "./models/activityLog.model.js"
import Notification from "./models/notification.model.js"

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const now = Date.now()
const daysAgo = (d) => new Date(now - d * DAY)
const daysFromNow = (d) => new Date(now + d * DAY)

const PRIORITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
const STATUS_PATH = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]

const blueprints = [
    {
        title: "Client Portal Redesign",
        description:
            "Redesign the customer portal with a new login flow, dashboard and payments.",
        client: 0,
        pm: 0,
        status: "DEVELOPMENT",
        tasks: [
            {
                title: "Design new login page",
                description: "Create the login and forgot password screens.",
                dev: 0,
                status: "DONE",
                priority: "HIGH",
                due: -6,
                created: 20,
            },
            {
                title: "Build dashboard layout",
                description: "Sidebar, top bar and responsive grid.",
                dev: 1,
                status: "IN_REVIEW",
                priority: "HIGH",
                due: 2,
                created: 14,
            },
            {
                title: "Integrate payments API",
                description: "Connect the payment gateway and handle webhooks.",
                dev: 0,
                status: "IN_PROGRESS",
                priority: "CRITICAL",
                due: -2,
                created: 12,
            },
            {
                title: "Write API documentation",
                description: "Document all endpoints with examples.",
                dev: 2,
                status: "TODO",
                priority: "LOW",
                due: 5,
                created: 9,
            },
            {
                title: "Fix mobile responsiveness",
                description: "Fix layout issues below 480px.",
                dev: 1,
                status: "IN_PROGRESS",
                priority: "MEDIUM",
                due: 3,
                created: 10,
            },
            {
                title: "Set up CI pipeline",
                description: "Run lint and tests on every pull request.",
                dev: 2,
                status: "TODO",
                priority: "MEDIUM",
                due: -1,
                created: 8,
            },
        ],
    },
    {
        title: "Mobile Ordering App",
        description:
            "Customer mobile app for browsing products and placing orders.",
        client: 0,
        pm: 0,
        status: "DEVELOPMENT",
        tasks: [
            {
                title: "Create product listing screen",
                description: "Grid of products with search and filters.",
                dev: 3,
                status: "DONE",
                priority: "MEDIUM",
                due: -4,
                created: 18,
            },
            {
                title: "Implement cart and checkout",
                description: "Cart state, address form and order summary.",
                dev: 3,
                status: "IN_PROGRESS",
                priority: "CRITICAL",
                due: 4,
                created: 11,
            },
            {
                title: "Push notification setup",
                description: "Order status push notifications.",
                dev: 0,
                status: "IN_REVIEW",
                priority: "HIGH",
                due: 1,
                created: 10,
            },
            {
                title: "Order history screen",
                description: "List past orders with reorder button.",
                dev: 1,
                status: "TODO",
                priority: "LOW",
                due: 14,
                created: 9,
            },
            {
                title: "Add offline mode",
                description: "Cache the catalog for offline browsing.",
                dev: 2,
                status: "TODO",
                priority: "MEDIUM",
                due: 9,
                created: 8,
            },
            {
                title: "App store listing assets",
                description: "Screenshots and descriptions for the stores.",
                dev: 3,
                status: "TODO",
                priority: "LOW",
                due: -3,
                created: 8,
            },
        ],
    },
    {
        title: "Inventory Analytics Dashboard",
        description:
            "Internal dashboard showing stock levels, trends and low stock alerts.",
        client: 1,
        pm: 1,
        status: "DESIGN",
        tasks: [
            {
                title: "Design database schema",
                description: "Model products, warehouses and stock movements.",
                dev: 2,
                status: "DONE",
                priority: "HIGH",
                due: -7,
                created: 21,
            },
            {
                title: "Build stock level charts",
                description: "Line and bar charts per warehouse.",
                dev: 3,
                status: "IN_PROGRESS",
                priority: "HIGH",
                due: 3,
                created: 12,
            },
            {
                title: "Low stock alert emails",
                description: "Send an email when stock falls below threshold.",
                dev: 2,
                status: "IN_REVIEW",
                priority: "MEDIUM",
                due: 5,
                created: 10,
            },
            {
                title: "Export report to CSV",
                description: "Download filtered reports as CSV.",
                dev: 1,
                status: "TODO",
                priority: "LOW",
                due: 12,
                created: 9,
            },
            {
                title: "Role based report access",
                description: "Restrict reports by warehouse manager role.",
                dev: 3,
                status: "TODO",
                priority: "CRITICAL",
                due: 6,
                created: 8,
            },
        ],
    },
]

const seed = async () => {
    if (process.env.NODE_ENV === "production") {
        console.error("Seeding is blocked in production.")
        process.exit(1)
    }

    await mongoose.connect(process.env.MONGODB_URL)

    await Promise.all([
        Notification.deleteMany({}),
        ActivityLog.deleteMany({}),
        Task.deleteMany({}),
        Project.deleteMany({}),
        Client.deleteMany({}),
        User.deleteMany({}),
    ])

    const password = await bcrypt.hash("Password@123", 10)

    const admin = await User.create({
        firstName: "Aarav",
        lastName: "Sharma",
        email: "admin@agency.com",
        password,
        jobTitle: "System Administrator",
        role: "ADMIN",
        createdBy: null,
    })

    const people = await User.insertMany(
        [
            {
                firstName: "Priya",
                lastName: "Nair",
                email: "priya.pm@agency.com",
                jobTitle: "Project Manager",
                role: "PROJECT_MANAGER",
            },
            {
                firstName: "Karthik",
                lastName: "Rao",
                email: "karthik.pm@agency.com",
                jobTitle: "Project Manager",
                role: "PROJECT_MANAGER",
            },
            {
                firstName: "Ravi",
                lastName: "Kumar",
                email: "ravi@agency.com",
                jobTitle: "SDE 2",
                role: "DEVELOPER",
            },
            {
                firstName: "Sneha",
                lastName: "Iyer",
                email: "sneha@agency.com",
                jobTitle: "SDE 1",
                role: "DEVELOPER",
            },
            {
                firstName: "Arjun",
                lastName: "Mehta",
                email: "arjun@agency.com",
                jobTitle: "SDE 2",
                role: "DEVELOPER",
            },
            {
                firstName: "Divya",
                lastName: "Reddy",
                email: "divya@agency.com",
                jobTitle: "SDE 1",
                role: "DEVELOPER",
            },
        ].map((u) => ({ ...u, password, createdBy: admin._id })),
    )

    const [pm1, pm2, ...devs] = people
    const pms = [pm1, pm2]

    const clients = await Client.insertMany([
        {
            clientName: "Rohan Gupta",
            companyName: "Acme Retail",
            email: "rohan@acmeretail.com",
            phone: "9876543210",
            createdBy: admin._id,
        },
        {
            clientName: "Meera Joshi",
            companyName: "Nova Logistics",
            email: "meera@novalogistics.com",
            phone: "9123456780",
            createdBy: admin._id,
        },
    ])

    const logs = []
    const notifications = []
    let taskTotal = 0
    let overdueTotal = 0

    for (const bp of blueprints) {
        const pm = pms[bp.pm]

        const project = await Project.create({
            projectTitle: bp.title,
            projectDescription: bp.description,
            client: clients[bp.client]._id,
            createdBy: pm._id,
            projectManager: pm._id,
            status: bp.status,
            taskCounter: bp.tasks.length,
        })

        const tasks = await Task.insertMany(
            bp.tasks.map((t, i) => {
                const dueDate = daysFromNow(t.due)
                return {
                    taskNumber: i + 1,
                    title: t.title,
                    description: t.description,
                    project: project._id,
                    assignedTo: devs[t.dev]._id,
                    createdBy: pm._id,
                    status: t.status,
                    priority: t.priority,
                    priorityRank: PRIORITY_RANK[t.priority],
                    dueDate,
                    isOverdue: dueDate.getTime() < now && t.status !== "DONE",
                    createdAt: daysAgo(t.created),
                }
            }),
        )

        tasks.forEach((task, i) => {
            const t = bp.tasks[i]
            const dev = devs[t.dev]
            const created = task.createdAt.getTime()
            const base = {
                task: task._id,
                project: project._id,
                assignedTo: dev._id,
            }

            taskTotal++

            logs.push({
                ...base,
                performedBy: pm._id,
                action: "TASK_CREATED",
                toValue: "TODO",
                createdAt: new Date(created),
            })
            logs.push({
                ...base,
                performedBy: pm._id,
                action: "TASK_ASSIGNED",
                toValue: String(dev._id),
                createdAt: new Date(created + 5 * 60 * 1000),
            })

            // one STATUS_CHANGE log per step the task has moved through
            const steps = STATUS_PATH.indexOf(t.status)
            for (let s = 1; s <= steps; s++) {
                logs.push({
                    ...base,
                    performedBy: STATUS_PATH[s] === "DONE" ? pm._id : dev._id,
                    action: "STATUS_CHANGE",
                    fromValue: STATUS_PATH[s - 1],
                    toValue: STATUS_PATH[s],
                    createdAt: new Date(created + s * 36 * HOUR),
                })
            }

            // notification: developer was assigned the task
            notifications.push({
                recipient: dev._id,
                sender: pm._id,
                type: "TASK_ASSIGNED",
                title: "New task assigned",
                message: `You were assigned Task #${task.taskNumber}: ${task.title}`,
                project: project._id,
                task: task._id,
                isRead: t.status !== "TODO",
                createdAt: new Date(created + 5 * 60 * 1000),
            })

            // notification: PM is told a task is waiting for review
            if (t.status === "IN_REVIEW") {
                notifications.push({
                    recipient: pm._id,
                    sender: dev._id,
                    type: "TASK_IN_REVIEW",
                    title: "Task ready for review",
                    message: `${dev.firstName} moved Task #${task.taskNumber} to In Review`,
                    project: project._id,
                    task: task._id,
                    isRead: false,
                    createdAt: new Date(created + 2 * 36 * HOUR),
                })
            }

            // overdue: log entry plus a notification for developer and PM
            if (task.isOverdue) {
                overdueTotal++
                const overdueAt = new Date(task.dueDate.getTime() + HOUR)

                logs.push({
                    ...base,
                    performedBy: pm._id,
                    action: "MARKED_OVERDUE",
                    fromValue: "false",
                    toValue: "true",
                    createdAt: overdueAt,
                })

                    ;[dev, pm].forEach((recipient) => {
                        notifications.push({
                            recipient: recipient._id,
                            type: "TASK_OVERDUE",
                            title: "Task overdue",
                            message: `Task #${task.taskNumber} (${task.title}) is past its due date`,
                            project: project._id,
                            task: task._id,
                            isRead: false,
                            createdAt: overdueAt,
                        })
                    })
            }
        })
    }

    await ActivityLog.insertMany(logs)
    await Notification.insertMany(notifications)

    console.log("Seed complete")
    console.log(
        `Users: ${people.length + 1}, Clients: ${clients.length}, Projects: ${blueprints.length}`,
    )
    console.log(
        `Tasks: ${taskTotal} (overdue: ${overdueTotal}), Activity logs: ${logs.length}, Notifications: ${notifications.length}`,
    )
    console.log("Password for every seeded user: Password@123")

    await mongoose.disconnect()
    process.exit(0)
}

seed().catch(async (err) => {
    console.error("Seed failed:", err)
    await mongoose.disconnect()
    process.exit(1)
})
