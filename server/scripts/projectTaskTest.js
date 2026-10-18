// Project and task management test.
//
// Covers the five rules a reviewer would check by hand:
//   1. an admin and a PM can create a project and attach it to a client
//   2. a task carries every required field, with sensible defaults
//   3. a status change is written to the database with a timestamp and the
//      user who made it — stored, not derived on read
//   4. a PM can only reach the projects they own
//   5. Overdue is set by the scheduled job, never by loading a page
//
// Point 5 is checked directly: a task past its due date is created, every read
// endpoint is exercised, and the flag must stay off — or, if the five-minute
// cron happened to fire in that window, it must carry a MARKED_OVERDUE row.
// The flag is then cleared and the sweep re-run, so the job has to do the work
// itself rather than inheriting it from the cron.
//
// It creates two probe projects and a handful of probe tasks, then removes them.
//
// Usage:  node scripts/projectTaskTest.js

import "dotenv/config"
import http from "http"
import mongoose from "mongoose"

import connectDb from "../config/connectDb.js"
import { initSocket } from "../sockets/socket.js"
import { runOverdueSweep } from "../jobs/overdue.job.js"
import Task from "../models/task.model.js"
import ActivityLog from "../models/activityLog.model.js"

const BASE =
    process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
const PASSWORD = "Password@123"

const ACCOUNTS = {
    admin: "admin@agency.com",
    pm: "priya.pm@agency.com",
    otherPm: "karthik.pm@agency.com",
    dev: "ravi@agency.com",
}

const results = []

const check = (name, ok, detail = "") => {
    results.push({ ok: Boolean(ok), name, detail })
    console.log(
        `${ok ? "  ok  " : " FAIL "} ${name}${detail ? ` — ${detail}` : ""}`,
    )
}

// ------------------------------------------------------------------ helpers

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

    if (res.status !== 200) throw new Error(`login failed for ${email}`)

    const payload = JSON.parse(
        Buffer.from(res.body.accessToken.split(".")[1], "base64url").toString(),
    )

    return { token: res.body.accessToken, userId: payload.userId }
}

const idOf = (value) => String(value?._id ?? value)

// a mongoose id that is well formed but belongs to nothing
const NO_SUCH_CLIENT = "000000000000000000000000"

const created = { projects: [], tasks: [] }

const createProject = async (token, body) => {
    const res = await api("POST", "/api/projects", { token, body })
    if (res.status === 201) created.projects.push(res.body.data._id)
    return res
}

const createTask = async (token, projectId, body) => {
    const res = await api("POST", `/api/projects/${projectId}/tasks`, {
        token,
        body,
    })
    if (res.status === 201) created.tasks.push(res.body.data._id)
    return res
}

// ------------------------------------------------------------------ the run

const main = async () => {
    console.log(`\nProject and task management test against ${BASE}\n`)

    // the job is imported, not the cron, so its socket fan-out needs a server
    // to talk to. Nothing listens on this one.
    const dummy = http.createServer()
    initSocket(dummy)

    await connectDb()

    const sessions = {}
    for (const [key, email] of Object.entries(ACCOUNTS)) {
        sessions[key] = await login(email)
    }

    const { admin, pm, otherPm, dev } = sessions
    const stamp = Date.now()

    // ================================================ 1. projects and clients
    console.log("1. Creating projects and attaching them to a client")

    const clients = (await api("GET", "/api/clients", { token: admin.token }))
        .body.data

    check(
        "there is an active client to attach a project to",
        clients.length > 0,
        `${clients.length} clients`,
    )

    const client = clients[0]

    // an admin picks the manager from the body
    const adminProject = await createProject(admin.token, {
        projectTitle: `probe admin project ${stamp}`,
        projectDescription: "created by the project and task management test",
        client: client._id,
        projectManager: otherPm.userId,
    })

    check(
        "an admin can create a project → 201",
        adminProject.status === 201,
        `got ${adminProject.status}`,
    )
    check(
        "the project is attached to the chosen client",
        idOf(adminProject.body?.data?.client) === idOf(client._id),
    )
    check(
        "the admin's chosen project manager is honoured",
        idOf(adminProject.body?.data?.projectManager) === otherPm.userId,
    )

    // a PM owns whatever they create, whatever the body says
    const pmProject = await createProject(pm.token, {
        projectTitle: `probe pm project ${stamp}`,
        projectDescription: "created by the project and task management test",
        client: client._id,
        projectManager: otherPm.userId,
    })

    check(
        "a PM can create a project → 201",
        pmProject.status === 201,
        `got ${pmProject.status}`,
    )
    check(
        "the project is attached to the client",
        idOf(pmProject.body?.data?.client) === idOf(client._id),
    )
    check(
        "the PM owns it, even though the body named another manager",
        idOf(pmProject.body?.data?.projectManager) === pm.userId,
        `manager ${idOf(pmProject.body?.data?.projectManager)}`,
    )

    const pmProjectId = pmProject.body?.data?._id

    // the client has to be real
    const badClient = await createProject(admin.token, {
        projectTitle: `probe bad client ${stamp}`,
        projectDescription: "should never be created",
        client: "not-an-id",
        projectManager: otherPm.userId,
    })
    check("a malformed client id is rejected → 400", badClient.status === 400)

    const missingClient = await createProject(admin.token, {
        projectTitle: `probe missing client ${stamp}`,
        projectDescription: "should never be created",
        client: NO_SUCH_CLIENT,
        projectManager: otherPm.userId,
    })
    check(
        "a client that does not exist is rejected → 404",
        missingClient.status === 404,
        `got ${missingClient.status}`,
    )

    const noClient = await createProject(admin.token, {
        projectTitle: `probe no client ${stamp}`,
        projectDescription: "should never be created",
        projectManager: otherPm.userId,
    })
    check("a project with no client is rejected → 400", noClient.status === 400)

    const devProject = await createProject(dev.token, {
        projectTitle: `probe dev project ${stamp}`,
        projectDescription: "should never be created",
        client: client._id,
    })
    check("a developer cannot create a project → 403", devProject.status === 403)

    // ==================================================== 2. the task's fields
    console.log("\n2. A task carries every required field")

    const task = await createTask(pm.token, pmProjectId, {
        title: "probe task with every field",
        description: "a task created by the project and task management test",
        assignedTo: dev.userId,
        priority: "HIGH",
        dueDate: "2026-12-31",
    })

    check(
        "a PM can create a task in their project → 201",
        task.status === 201,
        `got ${task.status}`,
    )

    const t = task.body?.data ?? {}
    check("title", t.title === "probe task with every field", String(t.title))
    check(
        "description",
        t.description ===
            "a task created by the project and task management test",
    )
    check(
        "assigned developer",
        idOf(t.assignedTo) === dev.userId,
        `assignedTo ${idOf(t.assignedTo)}`,
    )
    check("status defaults to TODO", t.status === "TODO", String(t.status))
    check("priority", t.priority === "HIGH", String(t.priority))
    check("due date", Boolean(t.dueDate), String(t.dueDate))
    check("task number inside the project", t.taskNumber === 1, String(t.taskNumber))

    // defaults
    const defaulted = await createTask(pm.token, pmProjectId, {
        title: "probe task with defaults",
        assignedTo: dev.userId,
        dueDate: "2026-12-31",
    })
    check(
        "priority defaults to MEDIUM when omitted",
        defaulted.body?.data?.priority === "MEDIUM",
        String(defaulted.body?.data?.priority),
    )
    check(
        "status defaults to TODO when omitted",
        defaulted.body?.data?.status === "TODO",
        String(defaulted.body?.data?.status),
    )

    // required fields
    const noDue = await createTask(pm.token, pmProjectId, {
        title: "probe task with no due date",
        assignedTo: dev.userId,
    })
    check("a task with no due date is rejected → 400", noDue.status === 400)

    const noAssignee = await createTask(pm.token, pmProjectId, {
        title: "probe task with no assignee",
        dueDate: "2026-12-31",
    })
    check("a task with no assignee is rejected → 400", noAssignee.status === 400)

    const noTitle = await createTask(pm.token, pmProjectId, {
        assignedTo: dev.userId,
        dueDate: "2026-12-31",
    })
    check("a task with no title is rejected → 400", noTitle.status === 400)

    // priorities and statuses are closed sets
    for (const priority of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]) {
        const res = await api("PATCH", `/api/tasks/${t._id}`, {
            token: pm.token,
            body: { priority },
        })
        check(`priority ${priority} is accepted`, res.status === 200, `got ${res.status}`)
    }

    const badPriority = await api("PATCH", `/api/tasks/${t._id}`, {
        token: pm.token,
        body: { priority: "URGENT" },
    })
    check("an unknown priority is rejected → 400", badPriority.status === 400)

    const badStatus = await api("PATCH", `/api/tasks/${t._id}/status`, {
        token: pm.token,
        body: { status: "BLOCKED" },
    })
    check("an unknown status is rejected → 400", badStatus.status === 400)

    // ============================================ 3. the status change history
    console.log("\n3. A status change is stored with a timestamp and a user")

    const devTasks = (await api("GET", "/api/tasks", { token: dev.token })).body
        .data
    check(
        "the task reaches the assigned developer's list",
        devTasks.some((row) => idOf(row._id) === idOf(t._id)),
        `${devTasks.length} tasks`,
    )

    const before = await api("GET", `/api/tasks/${t._id}/activity`, {
        token: admin.token,
    })
    check(
        "a new task already has a creation entry",
        before.body?.data?.some((row) => row.action === "TASK_CREATED"),
        `${before.body?.count} rows`,
    )

    const sequence = [
        ["IN_PROGRESS", "TODO"],
        ["IN_REVIEW", "IN_PROGRESS"],
        ["DONE", "IN_REVIEW"],
    ]

    for (const [next] of sequence) {
        const res = await api("PATCH", `/api/tasks/${t._id}/status`, {
            token: dev.token,
            body: { status: next },
        })
        check(
            `the developer can move the task to ${next} → 200`,
            res.status === 200,
            `got ${res.status}`,
        )
    }

    const history = (await api("GET", `/api/tasks/${t._id}/activity`, {
        token: admin.token,
    })).body.data

    const changes = history.filter((row) => row.action === "STATUS_CHANGE")

    check(
        "every status change left its own row",
        changes.length === sequence.length,
        `${changes.length} status rows for ${sequence.length} changes`,
    )

    check(
        "the rows are returned newest first",
        changes.every(
            (row, i) =>
                i === 0 ||
                new Date(changes[i - 1].createdAt).getTime() >=
                    new Date(row.createdAt).getTime(),
        ),
    )

    const latest = changes[0]
    check(
        "the newest row records the transition",
        latest?.fromValue === "IN_REVIEW" && latest?.toValue === "DONE",
        `${latest?.fromValue} → ${latest?.toValue}`,
    )

    check(
        "the row names the user who made the change",
        idOf(latest?.performedBy) === dev.userId,
        `performedBy ${idOf(latest?.performedBy)}`,
    )

    check(
        "the row carries a timestamp",
        Boolean(latest?.createdAt) &&
            !Number.isNaN(new Date(latest.createdAt).getTime()),
        String(latest?.createdAt),
    )

    check(
        "the timestamp is recent, so it is the change's own time",
        Math.abs(Date.now() - new Date(latest.createdAt).getTime()) < 120000,
    )

    check(
        "the row is attached to its task and project",
        idOf(latest?.task) === idOf(t._id) &&
            idOf(latest?.project) === idOf(pmProjectId),
    )

    // the earlier statuses survive: the history is stored, not derived from
    // the task's current state, which is DONE
    const currentTask = (await api("GET", `/api/tasks/${t._id}`, {
        token: admin.token,
    })).body.data

    check(
        "the task's current status is DONE",
        currentTask.status === "DONE",
        String(currentTask.status),
    )
    check(
        "earlier statuses are still readable after the task moved on",
        changes.some((row) => row.toValue === "IN_PROGRESS") &&
            changes.some((row) => row.toValue === "IN_REVIEW"),
    )

    const reread = (await api("GET", `/api/tasks/${t._id}/activity`, {
        token: admin.token,
    })).body.data.find((row) => idOf(row._id) === idOf(latest._id))

    check(
        "the same row comes back on a second read, with the same id and time",
        reread?.createdAt === latest.createdAt,
    )

    // ================================================== 4. a PM's own projects
    console.log("\n4. A PM can only reach their own projects")

    const pmProjects = (await api("GET", "/api/projects", { token: pm.token }))
        .body.data

    check(
        "the PM's project list holds only projects they manage",
        pmProjects.length > 0 &&
            pmProjects.every((p) => idOf(p.projectManager) === pm.userId),
        `${pmProjects.length} projects`,
    )

    const foreignRead = await api(
        "GET",
        `/api/projects/${adminProject.body.data._id}`,
        { token: pm.token },
    )
    check("another PM's project cannot be read → 404", foreignRead.status === 404)

    const foreignEdit = await api(
        "PATCH",
        `/api/projects/${adminProject.body.data._id}`,
        { token: pm.token, body: { status: "DELIVERED" } },
    )
    check("another PM's project cannot be edited → 404", foreignEdit.status === 404)

    const foreignDelete = await api(
        "DELETE",
        `/api/projects/${adminProject.body.data._id}`,
        { token: pm.token },
    )
    check("another PM's project cannot be deleted → 404", foreignDelete.status === 404)

    const foreignTask = await createTask(pm.token, adminProject.body.data._id, {
        title: "probe task in someone else's project",
        assignedTo: dev.userId,
        dueDate: "2026-12-31",
    })
    check(
        "a task cannot be added to another PM's project → 404",
        foreignTask.status === 404,
    )

    const ownerRead = await api(
        "GET",
        `/api/projects/${adminProject.body.data._id}`,
        { token: otherPm.token },
    )
    check(
        "the PM who does own it can still read it → 200",
        ownerRead.status === 200,
        `got ${ownerRead.status}`,
    )

    const pmTaskList = (await api("GET", "/api/tasks", { token: pm.token })).body
        .data
    const pmProjectIds = new Set(pmProjects.map((p) => idOf(p._id)))

    check(
        "the PM's task list holds only tasks from their own projects",
        pmTaskList.every((row) => pmProjectIds.has(idOf(row.project))),
        `${pmTaskList.length} tasks`,
    )

    // ======================================== 5. overdue comes from the job
    console.log("\n5. Overdue is set by the scheduled job, not by a page load")

    const late = await createTask(pm.token, pmProjectId, {
        title: "probe task already past its due date",
        assignedTo: dev.userId,
        dueDate: "2020-01-01",
    })

    check(
        "a task past its due date is created → 201",
        late.status === 201,
        `got ${late.status}`,
    )

    const lateId = late.body?.data?._id

    check(
        "creating it does not flag it overdue",
        late.body?.data?.isOverdue === false,
        `isOverdue ${late.body?.data?.isOverdue}`,
    )

    // exercise every read path a page load would use
    const readPaths = [
        [admin.token, "GET", "/api/tasks"],
        [pm.token, "GET", "/api/tasks"],
        [dev.token, "GET", "/api/tasks"],
        [admin.token, "GET", `/api/tasks/${lateId}`],
        [pm.token, "GET", `/api/tasks/${lateId}`],
        [dev.token, "GET", `/api/tasks/${lateId}`],
        [admin.token, "GET", `/api/tasks/${lateId}/activity`],
        [admin.token, "GET", "/api/projects"],
        [pm.token, "GET", `/api/projects/${pmProjectId}`],
        [admin.token, "GET", "/api/activity"],
        [dev.token, "GET", "/api/notifications"],
        [admin.token, "GET", "/api/users"],
        [admin.token, "GET", "/api/clients"],
    ]

    let readsOk = 0
    for (const [token, method, path] of readPaths) {
        const res = await api(method, path, { token })
        if (res.status === 200) readsOk += 1
    }

    check(
        "every read endpoint answered",
        readsOk === readPaths.length,
        `${readsOk}/${readPaths.length}`,
    )

    const afterReads = await api("GET", `/api/tasks/${lateId}`, {
        token: admin.token,
    })

    // The five-minute cron can legitimately fire while these reads run, so the
    // claim is that the reads never flip the flag *by themselves*: if it is
    // already set, the job must have left its own MARKED_OVERDUE row behind.
    const readHistory = (
        await api("GET", `/api/tasks/${lateId}/activity`, {
            token: admin.token,
        })
    ).body.data

    const flaggedWhileReading = readHistory.some(
        (row) => row.action === "MARKED_OVERDUE",
    )

    check(
        "reading a page does not flag it overdue",
        afterReads.body?.data?.isOverdue === false || flaggedWhileReading,
        afterReads.body?.data?.isOverdue === false
            ? "still un-flagged"
            : "the cron fired first, leaving a MARKED_OVERDUE row",
    )

    // Clear the flag so the sweep below has to do the work itself.
    await Task.updateOne({ _id: lateId }, { $set: { isOverdue: false } })
    await ActivityLog.deleteMany({ task: lateId, action: "MARKED_OVERDUE" })

    // now the job itself
    const sweep = await runOverdueSweep()

    check(
        "the overdue job reports what it flagged",
        typeof sweep.flagged === "number" && sweep.flagged >= 1,
        `flagged ${sweep.flagged}`,
    )

    const afterJob = await api("GET", `/api/tasks/${lateId}`, {
        token: admin.token,
    })
    check(
        "the job flags the late task overdue",
        afterJob.body?.data?.isOverdue === true,
        `isOverdue ${afterJob.body?.data?.isOverdue}`,
    )

    const lateHistory = (await api("GET", `/api/tasks/${lateId}/activity`, {
        token: admin.token,
    })).body.data

    const overdueRow = lateHistory.find((row) => row.action === "MARKED_OVERDUE")

    check(
        "the job leaves a MARKED_OVERDUE entry on the task",
        Boolean(overdueRow),
        overdueRow ? String(overdueRow.createdAt) : "no row",
    )
    check(
        "and the entry has a timestamp and an attributed user",
        Boolean(overdueRow?.createdAt) &&
            Boolean(overdueRow?.performedBy?._id ?? overdueRow?.performedBy),
    )

    // the second run is a no-op, because the task is already flagged
    const second = await runOverdueSweep()
    check(
        "running the job again flags nothing new",
        second.flagged === 0,
        `flagged ${second.flagged}`,
    )

    // ---------------------------------------------------------------- cleanup
    console.log("\n6. Cleanup")

    for (const id of created.tasks) {
        const res = await api("DELETE", `/api/tasks/${id}`, { token: admin.token })
        if (res.status !== 200) console.log(`   task ${id} → ${res.status}`)
    }

    for (const id of created.projects) {
        const res = await api("DELETE", `/api/projects/${id}`, {
            token: admin.token,
        })
        check(`probe project ${id} was deleted`, res.status === 200, `got ${res.status}`)
    }

    await mongoose.disconnect()
    dummy.close()

    const failed = results.filter((r) => !r.ok)
    console.log(
        `\n${results.length - failed.length}/${results.length} checks passed` +
            (failed.length ? ` — ${failed.length} FAILED\n` : "\n"),
    )

    if (failed.length) {
        for (const f of failed) console.log(`  FAILED: ${f.name} — ${f.detail}`)
    }

    // socket.io keeps handles open, so end the process deliberately
    process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
    console.error("\nTest run aborted:", error)
    process.exit(1)
})
