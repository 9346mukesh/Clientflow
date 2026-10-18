// Dashboard contract test.
//
// The three dashboards are drawn from two endpoints and one socket channel:
//
//   /api/projects   the project side of each summary
//   /api/tasks      every count, every breakdown, and every task list
//   presence:count  the live "online now" number
//
// The figures on screen are only right if those sources are complete, ordered
// and correctly scoped. This test pins that contract down from the outside:
//
//   1. /api/tasks returns a role's whole scope, never a hidden page, because
//      each dashboard counts what comes back
//   2. the order is priority first and due date second, which is what the
//      developer dashboard promises
//   3. each task-list filter narrows exactly the way its own query parameter
//      says — the parameters a shared URL carries
//   4. presence is a live count of distinct people, sent to admins only, and
//      refcounted so a person's second tab is not a second person
//
// It only reads. Nothing is created, changed or deleted.
//
// Assumption: nobody else is signed in as the "other developer" account while
// section 4 runs, so their arrival and departure can be watched.
//
// Usage:  node scripts/dashboardTest.js

import "dotenv/config"
import mongoose from "mongoose"
import { io } from "socket.io-client"

import connectDb from "../config/connectDb.js"
import Task from "../models/task.model.js"
import Project from "../models/project.model.js"

const BASE =
    process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
const PASSWORD = "Password@123"

const ACCOUNTS = {
    admin: "admin@agency.com",
    pm: "priya.pm@agency.com",
    dev: "ravi@agency.com",
    otherDev: "sneha@agency.com",
}

// mirrors PRIORITY_RANK in models/task.model.js
const PRIORITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

const results = []

const check = (name, ok, detail = "") => {
    results.push({ ok: Boolean(ok), name, detail })
    console.log(
        `${ok ? "  ok  " : " FAIL "} ${name}${detail ? ` — ${detail}` : ""}`,
    )
}

// ------------------------------------------------------------------ requests

const api = async (method, path, { token, body } = {}) => {
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== undefined) headers["Content-Type"] = "application/json"

    const res = await fetch(BASE + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    })

    let json = null
    try {
        json = await res.json()
    } catch {
        json = null
    }

    return { status: res.status, body: json }
}

const login = async (email) => {
    const res = await api("POST", "/api/auth/login", {
        body: { email, password: PASSWORD },
    })

    if (res.status !== 200) {
        throw new Error(`login failed for ${email}: ${res.status}`)
    }

    const payload = JSON.parse(
        Buffer.from(res.body.accessToken.split(".")[1], "base64url").toString(),
    )

    return { token: res.body.accessToken, userId: payload.userId }
}

const getTasks = async (token, query = {}) => {
    const search = new URLSearchParams(query).toString()
    const res = await api("GET", `/api/tasks${search ? `?${search}` : ""}`, {
        token,
    })
    return res
}

// ------------------------------------------------------------------- helpers

const idsOf = (tasks) => tasks.map((task) => String(task._id)).sort()

const sameSet = (left, right) => {
    const a = idsOf(left)
    const b = idsOf(right)
    return a.length === b.length && a.every((id, index) => id === b[index])
}

const asDateInput = (value) => new Date(value).toISOString().slice(0, 10)

// mirrors parseDate() in task.controller.js: a plain yyyy-mm-dd means the whole
// day, so dueTo includes everything that falls on it
const inRange = (tasks, from, to) => {
    const start = from ? new Date(from).getTime() : null

    let end = null
    if (to) {
        const date = new Date(to)
        if (/^\d{4}-\d{2}-\d{2}$/.test(to)) date.setUTCHours(23, 59, 59, 999)
        end = date.getTime()
    }

    return tasks.filter((task) => {
        const due = new Date(task.dueDate).getTime()
        if (start !== null && due < start) return false
        if (end !== null && due > end) return false
        return true
    })
}

// returns a description of the first pair that breaks priority-then-due-date
const outOfOrder = (tasks) => {
    for (let index = 1; index < tasks.length; index += 1) {
        const previous = tasks[index - 1]
        const current = tasks[index]

        const before = PRIORITY_RANK[previous.priority]
        const after = PRIORITY_RANK[current.priority]

        if (before < after) {
            return `#${previous.taskNumber} ${previous.priority} sits above #${current.taskNumber} ${current.priority}`
        }

        if (before === after) {
            const left = new Date(previous.dueDate).getTime()
            const right = new Date(current.dueDate).getTime()
            if (left > right) {
                return `#${previous.taskNumber} is due after #${current.taskNumber} at the same priority`
            }
        }
    }

    return null
}

// -------------------------------------------------------------------- sockets

const openSocket = (token) =>
    new Promise((resolve, reject) => {
        const socket = io(BASE, { auth: { token }, transports: ["websocket"] })

        const seen = []
        socket.onAny((event, payload) => seen.push({ event, payload }))

        const timer = setTimeout(
            () => reject(new Error("socket did not connect")),
            10000,
        )

        socket.on("connect", () => {
            clearTimeout(timer)
            resolve({ socket, seen })
        })

        socket.on("connect_error", (error) => {
            clearTimeout(timer)
            reject(new Error(error.message))
        })
    })

// the count carried by every presence event a socket has seen, in order
const countsSeen = (seen) =>
    seen
        .filter((entry) => entry.event === "presence:count")
        .map((entry) => entry.payload.count)

// waits for a presence event that arrives after this call started
const nextCount = async (seen, ms = 4000) => {
    const started = Date.now()
    const already = countsSeen(seen).length

    while (Date.now() - started < ms) {
        const counts = countsSeen(seen)
        if (counts.length > already) return counts[counts.length - 1]
        await settle(40)
    }

    return null
}

const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ----------------------------------------------------------------------- main

const main = async () => {
    await connectDb()

    console.log(`\nDashboard contract test against ${BASE}\n`)

    const admin = await login(ACCOUNTS.admin)
    const pm = await login(ACCOUNTS.pm)
    const dev = await login(ACCOUNTS.dev)

    // ------------------------- 1. every figure is drawn from the whole scope
    console.log("1. Every count is drawn from the whole scope, not a page")

    const all = await getTasks(admin.token)

    check(
        "the admin's task list answers with 200",
        all.status === 200,
        `got ${all.status}`,
    )

    const everyTask = await Task.countDocuments({})
    check(
        "it holds every task in the database",
        all.body?.count === everyTask,
        `list ${all.body?.count} vs database ${everyTask}`,
    )
    check(
        "its count matches the rows it returned",
        all.body?.count === all.body?.data?.length,
        `${all.body?.count} vs ${all.body?.data?.length} rows`,
    )
    check(
        "no task appears twice",
        new Set(idsOf(all.body.data)).size === all.body.data.length,
    )

    const pmProjectIds = await Project.find({
        projectManager: pm.userId,
    }).distinct("_id")

    const pmTasks = await getTasks(pm.token)
    const pmExpected = await Task.countDocuments({
        project: { $in: pmProjectIds },
    })

    check(
        "the PM's list holds every task in the projects they manage",
        pmTasks.body?.count === pmExpected,
        `list ${pmTasks.body?.count} vs database ${pmExpected}`,
    )
    check(
        "and nothing from another manager's projects",
        pmTasks.body.data.every((task) =>
            pmProjectIds.some((id) => String(id) === String(task.project?._id)),
        ),
    )
    check(
        "and the projects summary matches the projects endpoint",
        (await api("GET", "/api/projects", { token: pm.token })).body?.count ===
            pmProjectIds.length,
        `${pmProjectIds.length} managed`,
    )

    const devTasks = await getTasks(dev.token)
    const devExpected = await Task.countDocuments({ assignedTo: dev.userId })

    check(
        "the developer's list holds every task assigned to them",
        devTasks.body?.count === devExpected,
        `list ${devTasks.body?.count} vs database ${devExpected}`,
    )
    check(
        "and nothing assigned to anyone else",
        devTasks.body.data.every(
            (task) => String(task.assignedTo?._id) === dev.userId,
        ),
    )

    // --------------------------------------------- 2. priority, then due date
    console.log("\n2. Sorted by priority, then due date")

    check(
        "the developer's list is in that order",
        outOfOrder(devTasks.body.data) === null,
        outOfOrder(devTasks.body.data) || `${devTasks.body.count} tasks in order`,
    )
    check(
        "the admin's list is in that order too",
        outOfOrder(all.body.data) === null,
        outOfOrder(all.body.data) || `${all.body.count} tasks in order`,
    )

    const heaviest = TASK_PRIORITIES.filter((priority) =>
        devTasks.body.data.some((task) => task.priority === priority),
    ).pop()

    check(
        "the most urgent task on the board comes first",
        !heaviest || devTasks.body.data[0]?.priority === heaviest,
        `first is ${devTasks.body.data[0]?.priority}, most urgent present is ${heaviest}`,
    )

    // ------------------------------------- 3. filters follow their parameters
    console.log("\n3. Each filter answers exactly what its parameter says")

    for (const status of TASK_STATUSES) {
        const res = await getTasks(admin.token, { status })
        const expected = all.body.data.filter((task) => task.status === status)

        check(
            `status=${status} returns exactly the ${status} tasks`,
            res.status === 200 && sameSet(res.body.data, expected),
            `api ${res.body?.count} vs expected ${expected.length}`,
        )
    }

    for (const priority of TASK_PRIORITIES) {
        const res = await getTasks(admin.token, { priority })
        const expected = all.body.data.filter(
            (task) => task.priority === priority,
        )

        check(
            `priority=${priority} returns exactly the ${priority} tasks`,
            res.status === 200 && sameSet(res.body.data, expected),
            `api ${res.body?.count} vs expected ${expected.length}`,
        )
    }

    // the bite-sized window a shared URL would carry
    const dueTimes = all.body.data
        .map((task) => new Date(task.dueDate).getTime())
        .sort((a, b) => a - b)

    const from = asDateInput(dueTimes[Math.floor(dueTimes.length * 0.25)])
    const to = asDateInput(dueTimes[Math.floor(dueTimes.length * 0.75)])

    const fromOnly = await getTasks(admin.token, { dueFrom: from })
    check(
        `dueFrom=${from} returns only tasks due on or after it`,
        fromOnly.status === 200 &&
            sameSet(fromOnly.body.data, inRange(all.body.data, from, null)) &&
            fromOnly.body.data.every(
                (task) => new Date(task.dueDate).getTime() >= new Date(from).getTime(),
            ),
        `api ${fromOnly.body?.count} vs expected ${inRange(all.body.data, from, null).length}`,
    )

    const toOnly = await getTasks(admin.token, { dueTo: to })
    check(
        `dueTo=${to} includes everything due on that day`,
        toOnly.status === 200 &&
            sameSet(toOnly.body.data, inRange(all.body.data, null, to)),
        `api ${toOnly.body?.count} vs expected ${inRange(all.body.data, null, to).length}`,
    )

    const both = await getTasks(admin.token, { dueFrom: from, dueTo: to })
    check(
        `dueFrom=${from}&dueTo=${to} returns the window between them`,
        both.status === 200 &&
            sameSet(both.body.data, inRange(all.body.data, from, to)),
        `api ${both.body?.count} vs expected ${inRange(all.body.data, from, to).length}`,
    )
    check(
        "and that window is narrower than the unfiltered list",
        both.body.count < all.body.count && both.body.count > 0,
        `${both.body.count} of ${all.body.count}`,
    )

    const projectCounts = new Map()
    for (const task of all.body.data) {
        const id = String(task.project?._id || "")
        if (id) projectCounts.set(id, (projectCounts.get(id) || 0) + 1)
    }

    const busiestProject = [...projectCounts.entries()].sort(
        (left, right) => right[1] - left[1],
    )[0]?.[0]

    const byProject = await getTasks(admin.token, { project: busiestProject })
    check(
        "project=<id> returns only that project's tasks",
        byProject.status === 200 &&
            byProject.body.data.every(
                (task) => String(task.project?._id) === busiestProject,
            ) &&
            byProject.body.count ===
                all.body.data.filter(
                    (task) => String(task.project?._id) === busiestProject,
                ).length,
        `${byProject.body?.count} rows in the project`,
    )

    const windowTasks = inRange(all.body.data, from, to)

    // the busiest status/priority pair inside the window, so the combination
    // has something to actually narrow down to
    const pairs = new Map()
    for (const task of windowTasks) {
        const key = `${task.status}|${task.priority}`
        pairs.set(key, (pairs.get(key) || 0) + 1)
    }

    const [pairKey] = [...pairs.entries()].sort(
        (left, right) => right[1] - left[1],
    )[0] || ["TODO|MEDIUM"]

    const [pairStatus, pairPriority] = pairKey.split("|")

    const combined = await getTasks(admin.token, {
        status: pairStatus,
        priority: pairPriority,
        dueFrom: from,
        dueTo: to,
    })

    const combinedExpected = windowTasks.filter(
        (task) => task.status === pairStatus && task.priority === pairPriority,
    )

    check(
        "filters combine, so a shared URL reproduces the same rows",
        combined.status === 200 &&
            sameSet(combined.body.data, combinedExpected) &&
            combinedExpected.length > 0,
        `status=${pairStatus}&priority=${pairPriority} api ${combined.body?.count} vs expected ${combinedExpected.length}`,
    )

    const pairUnfiltered = all.body.data.filter(
        (task) => task.status === pairStatus && task.priority === pairPriority,
    ).length

    check(
        "and the combined view is no wider than either filter alone",
        combined.body.count <= both.body.count &&
            combined.body.count <= pairUnfiltered,
        `${combined.body.count} rows vs window ${both.body.count}, pair ${pairUnfiltered}`,
    )

    const badStatus = await getTasks(admin.token, { status: "NOPE" })
    const badPriority = await getTasks(admin.token, { priority: "NOPE" })
    const badDate = await getTasks(admin.token, { dueFrom: "not-a-date" })

    check(
        "an unknown status is rejected rather than ignored",
        badStatus.status === 400,
        `got ${badStatus.status}`,
    )
    check(
        "an unknown priority is rejected rather than ignored",
        badPriority.status === 400,
        `got ${badPriority.status}`,
    )
    check(
        "an unparseable date is rejected rather than ignored",
        badDate.status === 400,
        `got ${badDate.status}`,
    )

    const devWindow = await getTasks(dev.token, { status: "IN_PROGRESS" })
    check(
        "a developer's filtered list stays inside their own scope",
        devWindow.status === 200 &&
            devWindow.body.data.every(
                (task) =>
                    String(task.assignedTo?._id) === dev.userId &&
                    task.status === "IN_PROGRESS",
            ),
        `${devWindow.body?.count} in progress`,
    )

    // ------------------------------------------------- 4. live online count
    console.log("\n4. The online count is live, per person, and admin-only")

    const watcher = await openSocket(admin.token)
    await settle(400)

    const counts = countsSeen(watcher.seen)
    const base = counts.length ? counts[counts.length - 1] : null
    check(
        "the admin is told the count as soon as they connect",
        typeof base === "number",
        `count ${base}`,
    )

    const otherDev = await login(ACCOUNTS.otherDev)

    const tabOne = await openSocket(otherDev.token)
    const afterArrival = await nextCount(watcher.seen)
    const gained = afterArrival !== null ? afterArrival - base : null

    check(
        "a developer signing in raises the admin's count by one",
        gained === 1,
        `admin saw ${base} → ${afterArrival}`,
    )

    const devCountsBefore = countsSeen(tabOne.seen).length
    const tabTwo = await openSocket(otherDev.token)
    const afterSecondTab = await nextCount(watcher.seen)

    check(
        "a second tab for the same person adds nobody",
        afterSecondTab === afterArrival,
        `${afterArrival} → ${afterSecondTab}`,
    )
    check(
        "and the person is not told about their own extra tab",
        countsSeen(tabOne.seen).length === devCountsBefore,
        `the developer received ${countsSeen(tabOne.seen).length - devCountsBefore} extra count(s)`,
    )

    tabTwo.socket.close()
    const afterOneTabClosed = await nextCount(watcher.seen)
    check(
        "closing one of two tabs leaves the person counted",
        afterOneTabClosed === afterSecondTab,
        `${afterSecondTab} → ${afterOneTabClosed}`,
    )

    tabOne.socket.close()
    const afterLeaving = await nextCount(watcher.seen)
    check(
        "closing the last tab removes the person",
        afterLeaving === afterOneTabClosed - gained,
        `${afterOneTabClosed} → ${afterLeaving} (they had added ${gained})`,
    )

    const refused = await new Promise((resolve) => {
        const socket = io(BASE, { auth: {}, transports: ["websocket"] })
        const timer = setTimeout(() => resolve({ timedOut: true }), 6000)
        socket.on("connect", () => {
            clearTimeout(timer)
            socket.close()
            resolve({ connected: true })
        })
        socket.on("connect_error", (error) => {
            clearTimeout(timer)
            resolve({ message: error.message })
        })
    })

    check(
        "a socket with no token is refused, so the count cannot be faked",
        !refused.connected,
        refused.message || (refused.timedOut ? "no answer" : "connected"),
    )

    watcher.socket.close()
    await settle(200)

    // -------------------------------------------------------------------- done
    const failed = results.filter((result) => !result.ok)

    console.log(
        `\n${results.length - failed.length}/${results.length} checks passed${failed.length ? " — " + failed.length + " FAILED" : ""}`,
    )

    if (failed.length) {
        for (const result of failed) {
            console.log(`  FAILED: ${result.name} — ${result.detail}`)
        }
    }

    await mongoose.disconnect()

    // socket.io keeps handles open, so end the process deliberately
    process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
    console.error("\nTest run aborted:", error)
    process.exit(1)
})
