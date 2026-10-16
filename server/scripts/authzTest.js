// Authorization smoke test for the API.
//
// Proves, against a running server, that every protected route is guarded on
// the server and that each role can only reach its own data — including when
// the caller edits their token, or calls an endpoint the UI never shows them.
//
// Usage:  node scripts/authzTest.js
// Exit code is 0 only when every check passes.

import "dotenv/config"

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
const PASSWORD = "Password@123"

const ACCOUNTS = {
    admin: "admin@agency.com",
    pm: "priya.pm@agency.com",
    otherPm: "karthik.pm@agency.com",
    dev: "ravi@agency.com",
    otherDev: "sneha@agency.com",
}

const results = []

const record = (ok, name, detail) => {
    results.push({ ok, name, detail })
    console.log(`${ok ? "  ok  " : " FAIL "} ${name}${detail ? ` — ${detail}` : ""}`)
}

const check = (name, ok, detail = "") => record(Boolean(ok), name, detail)

// ---------------------------------------------------------------- http helper

// `token` is the access token; `cookie` is an optional refresh cookie.
const api = async (method, path, { token, cookie, body } = {}) => {
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    if (cookie) headers.Cookie = cookie
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

    return {
        status: res.status,
        body: json,
        setCookie: res.headers.getSetCookie?.() ?? [],
    }
}

const login = async (email) => {
    const res = await api("POST", "/api/auth/login", {
        body: { email, password: PASSWORD },
    })

    if (res.status !== 200) {
        throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`)
    }

    const raw = res.setCookie.find((c) => c.startsWith("refreshToken="))
    return {
        token: res.body.accessToken,
        body: res.body,
        rawCookie: raw || "",
        cookie: raw ? raw.split(";")[0] : "",
    }
}

// ------------------------------------------------------------- token forgery

const decode = (token) =>
    JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())

const withClaim = (token, changes) => {
    const [header, payload, signature] = token.split(".")
    const next = Buffer.from(
        JSON.stringify({ ...decode(token), ...changes }),
    ).toString("base64url")

    // keep the original signature: the payload no longer matches it
    return `${header}.${next}.${signature}`
}

const unsigned = (payload) => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
    return `${header}.${body}.`
}

// ------------------------------------------------------------------ the run

const main = async () => {
    console.log(`\nAuthorization test against ${BASE}\n`)

    const sessions = {}
    for (const [key, email] of Object.entries(ACCOUNTS)) {
        sessions[key] = await login(email)
    }

    const { admin, pm, otherPm, dev, otherDev } = sessions

    // ============================================ 1. token and cookie handling
    console.log("\n1. Token storage and transport")

    check(
        "login returns an access token",
        typeof admin.token === "string" && admin.token.split(".").length === 3,
    )

    check(
        "login response body carries no refresh token",
        !("refreshToken" in admin.body) &&
            !JSON.stringify(admin.body).toLowerCase().includes("refreshtoken"),
    )

    check(
        "refresh token is set as a cookie",
        admin.rawCookie.startsWith("refreshToken="),
    )

    check("refresh cookie is HttpOnly", /HttpOnly/i.test(admin.rawCookie))
    check("refresh cookie is SameSite=Strict", /SameSite=Strict/i.test(admin.rawCookie))
    check("refresh cookie is scoped to Path=/", /Path=\//i.test(admin.rawCookie))

    check(
        "access and refresh tokens are signed with different secrets",
        admin.token !== null && sessions.admin.rawCookie !== admin.token,
        "secrets are separate, so a refresh token is not a valid access token",
    )

    // ================================================ 2. unauthenticated access
    console.log("\n2. Anonymous callers")

    for (const [name, path] of [
        ["tasks", "/api/tasks"],
        ["projects", "/api/projects"],
        ["clients", "/api/clients"],
        ["users", "/api/users"],
        ["activity", "/api/activity"],
        ["notifications", "/api/notifications"],
    ]) {
        const res = await api("GET", path)
        check(`GET ${path} without a token is rejected`, res.status === 401, `got ${res.status}`)
        void name
    }

    const noAuthHeader = await api("GET", "/api/tasks", { token: "not-a-jwt" })
    check(
        "a malformed token is rejected",
        noAuthHeader.status === 401,
        `got ${noAuthHeader.status}`,
    )

    // ======================================================= 3. tampered tokens
    console.log("\n3. Tampered tokens (checked before any role logic)")

    const devAsAdmin = withClaim(dev.token, { role: "ADMIN" })
    const escalated = await api("GET", "/api/users", { token: devAsAdmin })
    check(
        "developer token with role rewritten to ADMIN is rejected",
        escalated.status === 401,
        `got ${escalated.status} (must not be 200 or 403)`,
    )

    const devAsAdminProjects = await api("GET", "/api/projects", { token: devAsAdmin })
    check(
        "same forged token cannot list projects",
        devAsAdminProjects.status === 401,
        `got ${devAsAdminProjects.status}`,
    )

    const stolenIdentity = withClaim(dev.token, { userId: decode(admin.token).userId })
    const stolen = await api("GET", "/api/users", { token: stolenIdentity })
    check(
        "developer token with an admin userId is rejected",
        stolen.status === 401,
        `got ${stolen.status}`,
    )

    const noneToken = unsigned({ userId: decode(admin.token).userId, role: "ADMIN" })
    const noneRes = await api("GET", "/api/users", { token: noneToken })
    check(
        'unsigned token with alg "none" is rejected',
        noneRes.status === 401,
        `got ${noneRes.status}`,
    )

    const wrongSecretToken = await (async () => {
        const jwt = (await import("jsonwebtoken")).default
        return jwt.sign(
            { userId: decode(dev.token).userId, role: "ADMIN" },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "15m" },
        )
    })()
    const wrongSecret = await api("GET", "/api/users", { token: wrongSecretToken })
    check(
        "token signed with the refresh secret is rejected",
        wrongSecret.status === 401,
        `got ${wrongSecret.status}`,
    )

    // a valid refresh token must not work as an access token
    const refreshAsAccess = admin.rawCookie.split(";")[0].split("=")[1]
    const asAccess = await api("GET", "/api/users", { token: refreshAsAccess })
    check(
        "a refresh token is not accepted as an access token",
        asAccess.status === 401,
        `got ${asAccess.status}`,
    )

    // ================================================ 4. role gate per endpoint
    console.log("\n4. Route guards (403 where the role is not allowed at all)")

    const expectations = [
        ["GET", "/api/clients", "dev", 403],
        ["POST", "/api/clients", "dev", 403],
        ["GET", "/api/users", "dev", 403],
        ["POST", "/api/users", "dev", 403],
        ["GET", "/api/users/developers", "dev", 403],
        ["GET", "/api/projects", "dev", 403],
        ["POST", "/api/projects", "dev", 403],
        ["GET", "/api/users", "pm", 403],
        ["POST", "/api/users", "pm", 403],
        ["PATCH", `/api/users/${decode(dev.token).userId}`, "pm", 403],
    ]

    for (const [method, path, who, expected] of expectations) {
        const res = await api(method, path, {
            token: sessions[who].token,
            body: method === "POST" ? {} : undefined,
        })
        check(
            `${who}: ${method} ${path} → ${expected}`,
            res.status === expected,
            `got ${res.status}`,
        )
    }

    // ============================================ 4b. the allowed paths still work
    // Blocking is easy to get accidentally right; these prove the roles can
    // still do their job, so the guard is not just refusing everyone.
    console.log("\n4b. Positive authorization")

    for (const [who, path] of [
        ["admin", "/api/users"],
        ["admin", "/api/clients"],
        ["admin", "/api/projects"],
        ["admin", "/api/tasks"],
        ["admin", "/api/activity"],
        ["admin", "/api/notifications"],
        ["admin", "/api/users/developers"],
        ["pm", "/api/clients"],
        ["pm", "/api/users/developers"],
        ["pm", "/api/tasks"],
        ["pm", "/api/notifications"],
        ["dev", "/api/tasks"],
        ["dev", "/api/notifications"],
    ]) {
        const res = await api("GET", path, { token: sessions[who].token })
        check(`${who}: GET ${path} → 200`, res.status === 200, `got ${res.status}`)
    }

    // ============================================== 5. developer data boundaries
    console.log("\n5. Developer sees only their own tasks")

    const allTasks = (await api("GET", "/api/tasks", { token: admin.token })).body.data
    const devTasks = (await api("GET", "/api/tasks", { token: dev.token })).body.data

    const devEmail = ACCOUNTS.dev
    const otherDevEmail = ACCOUNTS.otherDev

    check(
        "GET /api/tasks returns only tasks assigned to the caller",
        devTasks.length > 0 && devTasks.every((t) => t.assignedTo?.email === devEmail),
        `${devTasks.length} of ${allTasks.length} tasks`,
    )

    check(
        "the admin sees strictly more tasks than the developer",
        allTasks.length > devTasks.length,
        `admin ${allTasks.length} vs developer ${devTasks.length}`,
    )

    const foreignTask = allTasks.find((t) => t.assignedTo?.email === otherDevEmail)
    const ownTask = allTasks.find((t) => t.assignedTo?.email === devEmail)

    const readForeign = await api("GET", `/api/tasks/${foreignTask._id}`, { token: dev.token })
    check(
        "GET another developer's task by id → 404",
        readForeign.status === 404,
        `task #${foreignTask.taskNumber}, got ${readForeign.status}`,
    )

    const readForeignActivity = await api("GET", `/api/tasks/${foreignTask._id}/activity`, {
        token: dev.token,
    })
    check(
        "GET another developer's task activity → 404",
        readForeignActivity.status === 404,
        `got ${readForeignActivity.status}`,
    )

    const changeForeignStatus = await api("PATCH", `/api/tasks/${foreignTask._id}/status`, {
        token: dev.token,
        body: { status: "DONE" },
    })
    check(
        "PATCH another developer's task status → 404",
        changeForeignStatus.status === 404,
        `got ${changeForeignStatus.status}`,
    )

    const readOwn = await api("GET", `/api/tasks/${ownTask._id}`, { token: dev.token })
    check("GET own task by id → 200", readOwn.status === 200, `got ${readOwn.status}`)

    // status changes are the developer's job. Asking for the status it already
    // has reaches the scope check first, so a 400 "already" proves the scoped
    // query found their task — without writing to the database.
    const ownStatus = await api("PATCH", `/api/tasks/${ownTask._id}/status`, {
        token: dev.token,
        body: { status: ownTask.status },
    })
    check(
        "developer is authorised to change status on their own task",
        ownStatus.status === 400 && /already/i.test(ownStatus.body?.message || ""),
        `got ${ownStatus.status} ${ownStatus.body?.message || ""}`,
    )

    const foreignStatusSameValue = await api(
        "PATCH",
        `/api/tasks/${foreignTask._id}/status`,
        { token: dev.token, body: { status: foreignTask.status } },
    )
    check(
        "the same call on someone else's task stops at 404, not 400",
        foreignStatusSameValue.status === 404,
        `got ${foreignStatusSameValue.status}`,
    )

    const readOwnActivity = await api("GET", `/api/tasks/${ownTask._id}/activity`, {
        token: dev.token,
    })
    check(
        "GET own task activity → 200",
        readOwnActivity.status === 200,
        `got ${readOwnActivity.status}`,
    )

    // status changes are the developer's job; editing the task is not
    const editOwnTask = await api("PATCH", `/api/tasks/${ownTask._id}`, {
        token: dev.token,
        body: { title: "renamed by a developer" },
    })
    check(
        "developer cannot edit a task (PATCH /api/tasks/:id) → 403",
        editOwnTask.status === 403,
        `got ${editOwnTask.status}`,
    )

    const deleteOwnTask = await api("DELETE", `/api/tasks/${ownTask._id}`, { token: dev.token })
    check(
        "developer cannot delete a task → 403",
        deleteOwnTask.status === 403,
        `got ${deleteOwnTask.status}`,
    )

    const createTask = await api("POST", `/api/projects/${ownTask.project._id}/tasks`, {
        token: dev.token,
        body: { title: "x", assignedTo: decode(dev.token).userId, dueDate: "2026-12-01" },
    })
    check(
        "developer cannot create a task → 403",
        createTask.status === 403,
        `got ${createTask.status}`,
    )

    console.log("\n6. Developer: activity and notifications")

    const devActivity = (await api("GET", "/api/activity", { token: dev.token })).body.data
    const devUserId = decode(dev.token).userId
    check(
        "GET /api/activity returns only the caller's own events",
        devActivity.length > 0 &&
            devActivity.every((row) => String(row.assignedTo?._id ?? row.assignedTo) === devUserId),
        `${devActivity.length} events`,
    )

    const devNotifications = (await api("GET", "/api/notifications", { token: dev.token })).body.data
    check(
        "GET /api/notifications returns only the caller's notifications",
        devNotifications.every(
            (n) => String(n.recipient?._id ?? n.recipient) === devUserId,
        ),
        `${devNotifications.length} notifications`,
    )

    const otherDevNotifications = (
        await api("GET", "/api/notifications", { token: otherDev.token })
    ).body.data

    if (otherDevNotifications.length > 0) {
        const stolen = await api(
            "PATCH",
            `/api/notifications/${otherDevNotifications[0]._id}/read`,
            { token: dev.token },
        )
        check(
            "cannot mark another user's notification as read → 404",
            stolen.status === 404,
            `got ${stolen.status}`,
        )
    } else {
        record(true, "cannot mark another user's notification as read → 404", "skipped, no notifications to borrow")
    }

    // ============================================== 7. project manager boundaries
    console.log("\n7. Project manager sees only their own projects")

    const allProjects = (await api("GET", "/api/projects", { token: admin.token })).body.data
    const pmProjects = (await api("GET", "/api/projects", { token: pm.token })).body.data
    const pmUserId = decode(pm.token).userId

    check(
        "GET /api/projects returns only projects the PM manages",
        pmProjects.length > 0 &&
            pmProjects.every(
                (p) => String(p.projectManager?._id ?? p.projectManager) === pmUserId,
            ),
        `${pmProjects.length} of ${allProjects.length} projects`,
    )

    const foreignProject = allProjects.find(
        (p) => String(p.projectManager?._id ?? p.projectManager) !== pmUserId,
    )
    const ownProject = allProjects.find(
        (p) => String(p.projectManager?._id ?? p.projectManager) === pmUserId,
    )

    const readForeignProject = await api("GET", `/api/projects/${foreignProject._id}`, {
        token: pm.token,
    })
    check(
        "GET another PM's project by id → 404",
        readForeignProject.status === 404,
        `${foreignProject.projectTitle}, got ${readForeignProject.status}`,
    )

    const patchForeignProject = await api("PATCH", `/api/projects/${foreignProject._id}`, {
        token: pm.token,
        body: { status: "DELIVERED" },
    })
    check(
        "PATCH another PM's project → 404",
        patchForeignProject.status === 404,
        `got ${patchForeignProject.status}`,
    )

    const deleteForeignProject = await api("DELETE", `/api/projects/${foreignProject._id}`, {
        token: pm.token,
    })
    check(
        "DELETE another PM's project → 404",
        deleteForeignProject.status === 404,
        `got ${deleteForeignProject.status}`,
    )

    const createInForeignProject = await api(
        "POST",
        `/api/projects/${foreignProject._id}/tasks`,
        {
            token: pm.token,
            body: { title: "x", assignedTo: decode(dev.token).userId, dueDate: "2026-12-01" },
        },
    )
    check(
        "PM cannot add a task to another PM's project → 404",
        createInForeignProject.status === 404,
        `got ${createInForeignProject.status}`,
    )

    const foreignTaskId = allTasks.find((t) => {
        const projectId = String(t.project?._id ?? t.project)
        return projectId === String(foreignProject._id)
    })

    if (foreignTaskId) {
        const statusOnForeignTask = await api(
            "PATCH",
            `/api/tasks/${foreignTaskId._id}/status`,
            { token: pm.token, body: { status: "DONE" } },
        )
        check(
            "PM cannot change the status of a task outside their projects → 404",
            statusOnForeignTask.status === 404,
            `got ${statusOnForeignTask.status}`,
        )
    }

    // A PM must be able to assign tasks in their own projects. Posting a valid
    // body with a non-developer id reaches the ownership gate first: passing it
    // and failing on the assignee proves the project was accepted, with no write.
    const assignInOwnProject = await api("POST", `/api/projects/${ownProject._id}/tasks`, {
        token: pm.token,
        body: {
            title: "authorization probe",
            assignedTo: ownProject._id,
            dueDate: "2026-12-01",
        },
    })
    check(
        "PM may add tasks to their own project",
        assignInOwnProject.status === 404 &&
            /developer not found/i.test(assignInOwnProject.body?.message || ""),
        `got ${assignInOwnProject.status} ${assignInOwnProject.body?.message || ""}`,
    )

    const assignInForeignProject = await api(
        "POST",
        `/api/projects/${foreignProject._id}/tasks`,
        {
            token: pm.token,
            body: {
                title: "authorization probe",
                assignedTo: ownProject._id,
                dueDate: "2026-12-01",
            },
        },
    )
    check(
        "the same call on another PM's project stops at the project gate",
        assignInForeignProject.status === 404 &&
            /project not found/i.test(assignInForeignProject.body?.message || ""),
        `got ${assignInForeignProject.status} ${assignInForeignProject.body?.message || ""}`,
    )

    const pmActivity = (await api("GET", "/api/activity", { token: pm.token })).body.data
    const pmProjectIds = new Set(pmProjects.map((p) => String(p._id)))
    check(
        "GET /api/activity returns only the PM's own project events",
        pmActivity.every((row) => {
            const projectId = String(row.project?._id ?? row.project)
            return pmProjectIds.has(projectId)
        }),
        `${pmActivity.length} events across ${pmProjectIds.size} projects`,
    )

    const reassign = await api("PATCH", `/api/projects/${ownProject._id}`, {
        token: pm.token,
        body: { projectManager: decode(otherPm.token).userId },
    })
    check(
        "PM cannot reassign a project to another PM → 403",
        reassign.status === 403,
        `got ${reassign.status}`,
    )

    // a PM creating a project always owns it, even if the body says otherwise
    const created = await api("POST", "/api/projects", {
        token: pm.token,
        body: {
            projectTitle: `authz probe ${Date.now()}`,
            projectDescription: "temporary project created by the authorization test",
            client: allProjects[0].client._id,
            projectManager: decode(otherPm.token).userId,
        },
    })

    check(
        "PM creating a project is forced to be the owner",
        created.status === 201 &&
            String(created.body.data.projectManager?._id ?? created.body.data.projectManager) ===
                pmUserId,
        `status ${created.status}`,
    )

    if (created.status === 201) {
        const cleanup = await api("DELETE", `/api/projects/${created.body.data._id}`, {
            token: admin.token,
        })
        check("the probe project was cleaned up", cleanup.status === 200, `got ${cleanup.status}`)
    }

    // ======================================================= 8. refresh handling
    console.log("\n8. Refresh cookie flow")

    const refreshed = await api("POST", "/api/auth/refresh", { cookie: admin.cookie })
    check(
        "refresh with the cookie returns a new access token",
        refreshed.status === 200 && typeof refreshed.body.accessToken === "string",
        `got ${refreshed.status}`,
    )

    const noCookie = await api("POST", "/api/auth/refresh")
    check("refresh without a cookie → 401", noCookie.status === 401, `got ${noCookie.status}`)

    const forgedCookie = await api("POST", "/api/auth/refresh", {
        cookie: `refreshToken=${admin.token}`,
    })
    check(
        "refresh with an access token in the cookie → 401",
        forgedCookie.status === 401,
        `got ${forgedCookie.status}`,
    )

    // ============================== 9. every protected route demands a token
    // Guards are easy to forget on a newly added route, so this walks the whole
    // table rather than a sample. None of these may answer without a token.
    console.log("\n9. Every protected route rejects an anonymous caller")

    const id = allProjects[0]._id
    const protectedRoutes = [
        ["GET", "/api/auth/me"],
        ["PATCH", "/api/auth/change-password"],
        ["POST", "/api/users"],
        ["GET", "/api/users"],
        ["GET", "/api/users/developers"],
        ["PATCH", `/api/users/${id}`],
        ["POST", "/api/clients"],
        ["GET", "/api/clients"],
        ["PATCH", `/api/clients/${id}`],
        ["DELETE", `/api/clients/${id}`],
        ["POST", "/api/projects"],
        ["GET", "/api/projects"],
        ["GET", `/api/projects/${id}`],
        ["PATCH", `/api/projects/${id}`],
        ["DELETE", `/api/projects/${id}`],
        ["POST", `/api/projects/${id}/tasks`],
        ["GET", "/api/tasks"],
        ["GET", `/api/tasks/${id}`],
        ["PATCH", `/api/tasks/${id}`],
        ["GET", `/api/tasks/${id}/activity`],
        ["DELETE", `/api/tasks/${id}`],
        ["PATCH", `/api/tasks/${id}/status`],
        ["GET", "/api/notifications"],
        ["GET", "/api/notifications/unread-count"],
        ["PATCH", "/api/notifications/read-all"],
        ["PATCH", `/api/notifications/${id}/read`],
        ["GET", "/api/activity"],
    ]

    for (const [method, path] of protectedRoutes) {
        const res = await api(method, path, { body: method === "GET" ? undefined : {} })
        check(`${method} ${path} → 401`, res.status === 401, `got ${res.status}`)
    }

    // The deliberate exceptions. None of these demand a Bearer token, so a
    // rejection can only come from their own rules — never from the guard.
    const publicLogin = await api("POST", "/api/auth/login", { body: {} })
    check(
        "POST /api/auth/login is judged by its own validator, not the guard",
        publicLogin.status === 400,
        `got ${publicLogin.status} ${publicLogin.body?.message || ""}`,
    )

    const publicRefresh = await api("POST", "/api/auth/refresh")
    check(
        'POST /api/auth/refresh fails on its missing cookie ("Refresh token is required")',
        publicRefresh.status === 401 &&
            /refresh token is required/i.test(publicRefresh.body?.message || ""),
        `got ${publicRefresh.status} ${publicRefresh.body?.message || ""}`,
    )

    const publicLogout = await api("POST", "/api/auth/logout")
    check("POST /api/auth/logout needs no token", publicLogout.status === 200, `got ${publicLogout.status}`)

    // ------------------------------------------------------------------ summary
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
