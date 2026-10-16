// Real-time authorization test.
//
// The REST API and the socket channel have to enforce the same rules. If they
// drift, a role that is blocked over HTTP can still read the same data over a
// WebSocket — which is what a project room used to do for developers.
//
// This test proves the live channel is never wider than the REST API:
//   - a developer cannot join a project room, even one holding their task
//   - a developer never receives another developer's task payload or activity
//   - a developer still receives live updates for their own task
//   - a PM's own board still receives the project's task events
//
// It creates two throwaway tasks and deletes them again.
//
// Usage:  node scripts/socketAuthzTest.js

import "dotenv/config"
import { io } from "socket.io-client"

const BASE =
    process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
const PASSWORD = "Password@123"

const ACCOUNTS = {
    admin: "admin@agency.com",
    pm: "priya.pm@agency.com",
    otherPm: "karthik.pm@agency.com",
    dev: "ravi@agency.com",
    otherDev: "sneha@agency.com",
}

const results = []

const check = (name, ok, detail = "") => {
    results.push({ ok: Boolean(ok), name, detail })
    console.log(
        `${ok ? "  ok  " : " FAIL "} ${name}${detail ? ` — ${detail}` : ""}`,
    )
}

// ------------------------------------------------------------------ REST side

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

// ---------------------------------------------------------------- socket side

// every event a socket receives, kept so leaks can be inspected afterwards
const openSocket = (token) =>
    new Promise((resolve, reject) => {
        const socket = io(BASE, {
            auth: { token },
            transports: ["websocket"],
        })

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

const joinProject = (socket, projectId) =>
    new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ timeout: true }), 5000)
        socket.emit("project:join", projectId, (ack) => {
            clearTimeout(timer)
            resolve(ack || {})
        })
    })

// resolves with the first matching event, or null if it never arrives
const waitFor = (seen, predicate, ms = 4000) =>
    new Promise((resolve) => {
        const started = Date.now()

        const tick = () => {
            const hit = seen.find(predicate)
            if (hit) return resolve(hit)
            if (Date.now() - started > ms) return resolve(null)
            setTimeout(tick, 40)
        }

        tick()
    })

const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const mentions = (seen, id) =>
    seen.filter((entry) => JSON.stringify(entry.payload ?? "").includes(id))

// ------------------------------------------------------------------ the run

const main = async () => {
    console.log(`\nReal-time authorization test against ${BASE}\n`)

    const sessions = {}
    for (const [key, email] of Object.entries(ACCOUNTS)) {
        sessions[key] = await login(email)
    }

    const { admin, pm, otherPm, dev, otherDev } = sessions

    // open one socket per person, the way the app does
    const sockets = {}
    for (const key of Object.keys(ACCOUNTS)) {
        sockets[key] = await openSocket(sessions[key].token)
    }

    console.log("1. Socket handshake")

    check(
        "every role can open a socket with a valid access token",
        Object.values(sockets).every((s) => s.socket.connected),
    )

    // a socket with no token, and one with a developer token that claims to be
    // an admin in its payload, must both be refused at the handshake
    const noToken = await new Promise((resolve) => {
        const socket = io(BASE, { auth: {}, transports: ["websocket"] })
        const timer = setTimeout(() => resolve("timeout"), 6000)
        socket.on("connect", () => {
            clearTimeout(timer)
            socket.close()
            resolve("connected")
        })
        socket.on("connect_error", (error) => {
            clearTimeout(timer)
            socket.close()
            resolve(error.message)
        })
    })
    check(
        "a socket with no token is refused",
        noToken !== "connected" && noToken !== "timeout",
        noToken,
    )

    const forged = (() => {
        const [header, payload, signature] = dev.token.split(".")
        const next = Buffer.from(
            JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), role: "ADMIN" }),
        ).toString("base64url")
        return `${header}.${next}.${signature}`
    })()

    const forgedResult = await new Promise((resolve) => {
        const socket = io(BASE, { auth: { token: forged }, transports: ["websocket"] })
        const timer = setTimeout(() => resolve("timeout"), 6000)
        socket.on("connect", () => {
            clearTimeout(timer)
            socket.close()
            resolve("connected")
        })
        socket.on("connect_error", (error) => {
            clearTimeout(timer)
            socket.close()
            resolve(error.message)
        })
    })
    check(
        "a socket with a role rewritten to ADMIN is refused",
        forgedResult !== "connected" && forgedResult !== "timeout",
        forgedResult,
    )

    // ------------------------------------------------------------- project room
    console.log("\n2. Project rooms")

    const projects = (await api("GET", "/api/projects", { token: admin.token }))
        .body.data
    const tasks = (await api("GET", "/api/tasks", { token: admin.token })).body
        .data

    const pmProject = projects.find(
        (p) =>
            String(p.projectManager?._id ?? p.projectManager) === pm.userId &&
            tasks.some(
                (t) =>
                    String(t.project?._id ?? t.project) === String(p._id) &&
                    String(t.assignedTo?._id ?? t.assignedTo) === dev.userId,
            ),
    )

    if (!pmProject) {
        throw new Error(
            "no project owned by the PM holds a task belonging to the developer",
        )
    }

    const projectId = String(pmProject._id)
    console.log(`   project: ${pmProject.projectTitle} (${projectId})`)

    const adminJoin = await joinProject(sockets.admin.socket, projectId)
    check("an admin may join any project room", adminJoin.ok === true, JSON.stringify(adminJoin))

    const pmJoin = await joinProject(sockets.pm.socket, projectId)
    check("the owning PM may join their project room", pmJoin.ok === true, JSON.stringify(pmJoin))

    const otherPmJoin = await joinProject(sockets.otherPm.socket, projectId)
    check(
        "another PM may not join the project room",
        otherPmJoin.ok === false,
        JSON.stringify(otherPmJoin),
    )

    // the important one: the developer has a task in this project, and still
    // may not subscribe to the whole board
    const devJoin = await joinProject(sockets.dev.socket, projectId)
    check(
        "a developer may not join a project room, even one holding their task",
        devJoin.ok === false,
        JSON.stringify(devJoin),
    )

    const otherDevJoin = await joinProject(sockets.otherDev.socket, projectId)
    check(
        "the other developer may not join it either",
        otherDevJoin.ok === false,
        JSON.stringify(otherDevJoin),
    )

    // ------------------------------------------------- a task for someone else
    console.log("\n3. Another developer's task must not reach the developer")

    sockets.dev.seen.length = 0
    sockets.otherDev.seen.length = 0

    const foreign = await api("POST", `/api/projects/${projectId}/tasks`, {
        token: pm.token,
        body: {
            title: `socket probe for the other developer ${Date.now()}`,
            description: "temporary task created by the socket authorization test",
            assignedTo: otherDev.userId,
            dueDate: "2026-12-31",
        },
    })

    check(
        "the PM can create the probe task",
        foreign.status === 201,
        `got ${foreign.status}`,
    )

    const foreignId = foreign.body?.data?._id
    const foreignEvents = mentions(sockets.dev.seen, foreignId)

    const otherDevSaw = await waitFor(
        sockets.otherDev.seen,
        (e) => e.event === "task:created" && e.payload?._id === foreignId,
    )

    check(
        "the assigned developer receives their new task live",
        Boolean(otherDevSaw),
        otherDevSaw ? "task:created" : "nothing arrived",
    )

    check(
        "the developer is not in the room, so the board event never reaches them",
        !sockets.dev.seen.some((e) => e.event === "task:created"),
        `${sockets.dev.seen.length} events received in total`,
    )

    check(
        "nothing about the other developer's task leaked to the developer",
        foreignEvents.length === 0,
        foreignEvents.length
            ? foreignEvents.map((e) => e.event).join(", ")
            : "no reference to the task id",
    )

    const otherDevActivity = await waitFor(
        sockets.otherDev.seen,
        (e) => e.event === "activity:new" && e.payload?.task?._id === foreignId,
    )
    check(
        "the assigned developer receives the activity rows for it",
        Boolean(otherDevActivity),
        otherDevActivity ? "activity:new" : "nothing arrived",
    )

    const devActivityForForeign = sockets.dev.seen.filter(
        (e) => e.event === "activity:new" && e.payload?.task?._id === foreignId,
    )
    check(
        "the developer receives no activity rows for it",
        devActivityForForeign.length === 0,
        `${devActivityForForeign.length} rows`,
    )

    const pmSawBoardEvent = sockets.pm.seen.some(
        (e) => e.event === "task:created" && e.payload?._id === foreignId,
    )
    check(
        "the PM's own board still receives the project's task events",
        pmSawBoardEvent,
    )

    // ----------------------------------------------- the developer's own task
    console.log("\n4. The developer's own updates still arrive")

    sockets.dev.seen.length = 0
    sockets.otherDev.seen.length = 0

    const own = await api("POST", `/api/projects/${projectId}/tasks`, {
        token: pm.token,
        body: {
            title: `socket probe for the developer ${Date.now()}`,
            description: "temporary task created by the socket authorization test",
            assignedTo: dev.userId,
            dueDate: "2026-12-31",
        },
    })

    check(
        "the PM can create the developer's probe task",
        own.status === 201,
        `got ${own.status}`,
    )

    const ownId = own.body?.data?._id

    const ownTaskEvent = await waitFor(
        sockets.dev.seen,
        (e) => e.event === "task:created" && e.payload?._id === ownId,
    )
    check(
        "the developer receives their own task live, through their private room",
        Boolean(ownTaskEvent),
        ownTaskEvent ? "task:created" : "nothing arrived",
    )

    const ownNotification = await waitFor(
        sockets.dev.seen,
        (e) => e.event === "notification:new" && e.payload?.notification?.task === ownId,
    )
    check(
        "and the matching notification",
        Boolean(ownNotification),
        ownNotification ? "notification:new" : "nothing arrived",
    )

    check(
        "the other developer hears nothing about this task",
        mentions(sockets.otherDev.seen, ownId).length === 0,
        `${mentions(sockets.otherDev.seen, ownId).length} references`,
    )

    // a status change moves through a different code path, so check it too
    sockets.dev.seen.length = 0
    sockets.otherDev.seen.length = 0

    const moved = await api("PATCH", `/api/tasks/${ownId}/status`, {
        token: dev.token,
        body: { status: "IN_PROGRESS" },
    })
    check(
        "the developer can move their own task",
        moved.status === 200,
        `got ${moved.status}`,
    )

    const statusEvent = await waitFor(
        sockets.dev.seen,
        (e) => e.event === "task:updated" && e.payload?._id === ownId,
    )
    check(
        "the status change reaches the developer live",
        Boolean(statusEvent),
        statusEvent ? "task:updated" : "nothing arrived",
    )

    check(
        "the other developer still hears nothing",
        mentions(sockets.otherDev.seen, ownId).length === 0,
    )

    // --------------------------------------------------------------- cleanup
    console.log("\n5. Cleanup")

    for (const [label, id] of [
        ["the other developer's probe task", foreignId],
        ["the developer's probe task", ownId],
    ]) {
        const res = await api("DELETE", `/api/tasks/${id}`, { token: pm.token })
        check(`${label} was deleted`, res.status === 200, `got ${res.status}`)
    }

    for (const { socket } of Object.values(sockets)) socket.close()

    const failed = results.filter((r) => !r.ok)
    console.log(
        `\n${results.length - failed.length}/${results.length} checks passed` +
            (failed.length ? ` — ${failed.length} FAILED\n` : "\n"),
    )

    if (failed.length) {
        for (const f of failed) console.log(`  FAILED: ${f.name} — ${f.detail}`)
        process.exitCode = 1
    }
}

main().catch((error) => {
    console.error("\nTest run aborted:", error.message)
    process.exitCode = 1
})
