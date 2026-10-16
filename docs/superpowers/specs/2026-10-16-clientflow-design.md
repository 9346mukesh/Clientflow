# ClientFlow — Design Spec

Date: 2026-10-16
Status: Approved (pending implementation)

## Goal

Complete the ClientFlow full-stack app to satisfy the hiring assessment brief:
JWT auth with 3 roles enforced at the API level, project/task management with a
persisted activity log, a real-time activity feed over WebSockets, role-scoped
dashboards with URL filters, DB-backed notifications, and a scheduled overdue
job. Backend first, then the React frontend.

## Current state

- `server/` — Express + Mongoose API. Models, controllers, routes, middleware,
  seed and a socket auth layer exist. Frontend (`client/`) is empty; `README.md`
  is empty.
- Gaps: `socket.io`, `node-cron`, `zod` not installed (server crashes on boot);
  no socket emissions; notifications and the global activity feed have no API;
  no overdue job; refresh-token handler bug; missing project-delete route;
  validators unwired; seed bug on line 423.

## Constraints / conventions

- Plain JavaScript (no TypeScript), ESM, no semicolons, 4-space indent,
  arrow functions, step-commented controllers, `{ success, message, data }`
  response shape.
- MongoDB via Mongoose. All secrets in `.env`.
- Socket.io for real-time; `node-cron` for the scheduler.

## Part 1 — Backend completion

### Dependencies
- Add `socket.io`, `node-cron`, `zod`. Remove `bcryptjs` (use `bcrypt`).

### Real-time layer (`sockets/socket.js` + `sockets/events.js`)
Rooms:
- `user:<userId>` — every socket (notifications, personal feed rows)
- `admin` — admins (global feed, presence count)
- `project:<id>` — clients viewing a project (`project:join` / `project:leave`)

Presence: module map `userId → Set<socketId>`; broadcast `presence:count` to
`admin` on connect/disconnect and to a new socket on join.

Event contract (server → client):
- `activity:new` → `project:<id>`, `admin`, `user:<pmId>`, `user:<assignedTo>`
- `task:created` / `task:updated` / `task:deleted` → `project:<id>`
- `notification:new` → `user:<recipient>` with `{ notification, unreadCount }`
- `notification:read` → `user:<recipient>` with `{ unreadCount }`
- `presence:count` → `admin` (and to the connecting socket)

Emission helpers live in `sockets/events.js` and are called by controllers
after DB writes commit.

### Notifications API (`controllers/notification.controller.js`)
- `GET /api/notifications?unread=true&limit=` — paginated, newest first
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all` (uses model static `markAllAsRead`)

All scoped to `recipient = req.user.userId`.

### Activity feed API (`controllers/activity.controller.js`)
- `GET /api/activity?limit=20&before=<ISO>` — role scoped:
  Admin = all; PM = projects they manage; Developer = `assignedTo = self`.
  `before` is a `createdAt` cursor so a reconnecting client fetches the last N
  it missed, from the DB. Returns the same payload shape the socket emits.

### Overdue job (`jobs/overdue.job.js`)
`node-cron` every 5 minutes: tasks with `isOverdue:false`, `status != DONE`,
`dueDate < now` → set `isOverdue:true`, write `MARKED_OVERDUE` activity logs and
`TASK_OVERDUE` notifications to developer + PM, emit socket events. Guard on
`mongoose.connection.readyState`.

### Validation (`validators/*` + `middlewares/validate.middleware.js`)
Add `auth`, `project`, `task` schemas; fix `user` (missing `password`). Apply
`validate()` on all write routes. Controllers keep defensive checks.

### Bug fixes / hardening
- `handleRefresh`: destructuring bug → assign the returned string.
- Register `DELETE /api/projects/:id`.
- `seed.js`: `[(dev, pm)]` → `[dev, pm]`; use `bcrypt`.
- `app.js`: remove unused import; add 404 + structured error handler.
- Ensure `.env` is gitignored.

## Part 2 — Frontend (`client/`)

Stack: React (JS) + Vite + Tailwind CSS + Redux Toolkit + RTK Query +
socket.io-client.

Structure:
```
client/src/
  app/store.js
  app/api/apiSlice.js         # base query: Bearer header, 401 -> refresh -> retry
  features/auth/              # authSlice, LoginPage, ChangePasswordPage, ProtectedRoute
  features/{users,clients,projects,tasks}/   # RTK Query APIs
  features/notifications/     # slice + NotificationBell (badge + dropdown, live)
  features/activity/          # live ActivityFeed + per-task history
  features/presence/          # online count slice
  sockets/SocketProvider.jsx  # connect, project:join, dispatch events into store
  components/                 # Layout, RoleGate, Badge, Table, FilterBar, Avatar
  pages/                      # role dashboards, projects, project detail, tasks, users, clients
  lib/format.js               # relative time + "Ravi moved Task #12 from ... → ..."
```

- Access token in memory only; refresh token stays in the HttpOnly cookie.
- On app load: `POST /api/auth/refresh` → `/api/auth/me`.
- Filters via `useSearchParams` (shareable URLs).
- On socket (re)connect: fetch last 20 events from `/api/activity` and merge.
- Dashboards per role exactly per the brief.

## Part 3 — README

Document: Socket.io vs native WS, node-cron choice, RTK Query/Redux split,
indexing rationale, security model, setup/run instructions.

## Execution order

1. Backend infra: deps, sockets/events, presence, error handler.
2. Notifications API, activity API, overdue job.
3. Validators wired; bug fixes; seed + README.
4. Verify backend end to end with seeded data.
5. Frontend scaffold → auth/socket → layouts/dashboards → CRUD → live feed →
   notifications → filters.
6. End-to-end smoke test.
