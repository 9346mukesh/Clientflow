# ClientFlow

A real-time client project dashboard for a small agency. Admins, project
managers and developers sign in to manage clients, projects and tasks, and to
watch a **live activity feed** of what the team is doing — updates appear over
WebSockets without a refresh.

- **Backend** — Node.js, Express 5, MongoDB (Mongoose), Socket.io, node-cron
- **Frontend** — React (JavaScript), Vite, Redux Toolkit + RTK Query, Tailwind CSS
- **Auth** — JWT access token (memory) + refresh token (HttpOnly cookie)

---

## Contents

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Roles and permissions](#roles-and-permissions)
- [Architecture](#architecture)
- [Frontend design system](#frontend-design-system)
- [Real-time design (WebSockets)](#real-time-design-websockets)
- [Background job (overdue tasks)](#background-job-overdue-tasks)
- [Notifications](#notifications)
- [Database indexing decisions](#database-indexing-decisions)
- [Security model](#security-model)
- [Validation and error handling](#validation-and-error-handling)
- [API reference](#api-reference)
- [Socket event reference](#socket-event-reference)
- [Assumptions](#assumptions)

---

## Quick start

Requires Node 18+ and a MongoDB connection string.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env          # fill in the values below
npm run seed                  # optional: load demo data
npm run dev                   # http://localhost:5001
```

`server/.env`:

```
PORT=5001
MONGODB_URL=mongodb://127.0.0.1:27017/clientflow
JWT_ACCESS_SECRET=some-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
CLIENT_URL=http://localhost:5173
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to the backend, so the
browser talks to a single origin and the HttpOnly refresh cookie stays
first-party.

---

## Demo accounts

Every seeded user has the password `Password@123`.

| Role            | Email                   |
| --------------- | ----------------------- |
| Admin           | `admin@agency.com`      |
| Project Manager | `priya.pm@agency.com`   |
| Project Manager | `karthik.pm@agency.com` |
| Developer       | `ravi@agency.com`       |
| Developer       | `sneha@agency.com`      |
| Developer       | `arjun@agency.com`      |
| Developer       | `divya@agency.com`      |

---

## Roles and permissions

Authorization is enforced **on the server for every protected route**, not by
hiding buttons. Role scoping is applied inside the database queries, so even a
hand-crafted request with a valid token cannot reach another user's data.

| Capability                       | Admin | Project Manager            | Developer            |
| -------------------------------- | :---: | -------------------------- | -------------------- |
| Manage users                     |  ✅   | —                          | —                    |
| Manage clients                   |  ✅   | read (active only)         | —                    |
| Create / edit projects           |  ✅   | own projects only          | —                    |
| Reassign a project's manager     |  ✅   | —                          | —                    |
| Create / edit / delete tasks     |  ✅   | own projects only          | —                    |
| Move a task's status             |  ✅   | own projects only          | own tasks only       |
| See tasks                        |  all  | tasks in own projects      | only assigned tasks  |
| Activity feed                    | global| own projects               | own assigned tasks   |

Two rules are worth calling out:

- **A PM always owns what they create.** When a PM creates a project the
  `projectManager` in the request body is ignored.
- **A developer cannot reach a PM's data.** `GET /api/projects` is not even
  exposed to developers, and `GET /api/tasks` is filtered to
  `assignedTo = <me>`.

---

## Architecture

```
server/
  app.js              express app, middleware, route mounting, 404 + error handler
  index.js            http server, socket init, cron start, dotenv
  config/             database connection
  models/             Mongoose schemas (User, Client, Project, Task,
                      ActivityLog, Notification)
  controllers/        request handlers (role scoping lives here)
  routes/             route tables + authorization + validation
  middlewares/        auth (JWT), authorize (role gate), validate (zod),
                      requestTimer
  validators/         zod schemas for every write endpoint
  sockets/            socket.js (rooms + presence), events.js (emit helpers)
  jobs/               overdue.job.js (node-cron scheduler)
  seed.js             demo data

client/src/
  app/                store + RTK Query base (auth header, 401 -> refresh -> retry)
  features/           auth, users, clients, projects, tasks, notifications,
                      activity, presence, dashboard, theme, ui — each owns its
                      slice + api
  sockets/            socket singleton + SocketBridge + useProjectRoom
  components/         layout, footer, brand, toasts, search, cookie banner,
                      scroll progress, ui primitives, task table/modals, filters
  pages/              login, dashboards, projects, project detail, tasks,
                      users, clients, activity, legal (privacy/terms/cookies)
  lib/                formatting helpers, constants, document meta hook
```

**State management split** — the reason for two stores:

- **RTK Query** owns *server state*: caching, loading/error states and cache
  invalidation. `task`/`project`/`activity`/`notification` tag invalidation is
  what keeps lists fresh when a socket event arrives.
- **Redux slices** own *client and real-time state*: the in-memory access
  token, the live activity buffer, the unread count, the online presence
  count, the theme mode and transient UI (toasts, cookie consent). These are
  updated by socket events, not by fetching.

---

## Frontend design system

The interface is deliberately restrained: a single **monochrome graphite**
ramp, and colour reserved for meaning (status, priority, errors, destructive
actions). There is no purple and no decorative blue.

- **Tokens** — `client/src/index.css` defines semantic custom properties
  (`--c-page`, `--c-surface`, `--c-line`, `--c-ink`, `--c-muted`, …) for light
  and dark, exposed to Tailwind through `@theme inline`. Components only ever
  reference `bg-surface`, `text-muted`, `border-line` and friends, so retheming
  happens in one file.
- **Dark mode** — class-based (`@custom-variant dark`). Default is light; the
  choice is stored in `localStorage` and applied by an inline script in
  `index.html` before first paint, so there is no flash.
- **Type** — Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono for
  data: task numbers, counts, timestamps and the small uppercase eyebrows.
- **Priority is encoded by weight**, not by four competing hues: outline →
  tinted → amber → red. Status uses two neutral weights, amber for "needs
  attention" and green for "finished".
- **Signature** — a 2px graphite rail across the top of the viewport that
  tracks scroll position, and turns into an indeterminate sweep while a write
  is in flight.

Frontend features that back the polish pass:

- **Accessibility** — skip links on every shell, a visible `:focus-visible`
  ring on all controls, focus-trapped modals and drawers that restore focus and
  close on `Escape`, labelled icon-only buttons, `aria-live` toasts, and
  `role="alert"` validation messages.
- **Responsive tables** — task, client and user tables render as cards below
  `md`, so no page scrolls sideways on a phone.
- **Loading and empty states** — skeleton loaders for lists and cards, a
  branded splash during auth bootstrap, and purposeful empty states with an
  action.
- **Command palette** — ⌘K / Ctrl-K opens a role-scoped search over projects,
  tasks, clients and people. It only reads endpoints the signed-in user may
  already call, so results cannot leak across roles. The trigger sits in the
  header, immediately left of the theme toggle, at every width.
- **Collapsible rail** — the desktop sidebar folds down to icons only and
  remembers the choice between visits. A collapsed item keeps its name as a
  tooltip and as its accessible label, so nothing becomes a mystery icon.
- **A ten-day task window** — task filters open on today -5 to today +5 days and
  write that window into the URL, so the view can be shared. "Clear filters"
  widens it back to everything rather than silently re-applying the default.
- **Three role dashboards** — an admin sees every project, a task count broken
  down by status, the overdue count and a live "N online" fed by the socket; a
  PM sees their projects, a breakdown by priority and everything due in the next
  seven days; a developer sees their own tasks, priority first and due date
  second. The admin and PM dashboards are unfiltered, so a headline figure there
  counts the whole scope rather than whatever a list happens to show.
- **Activity that opens** — every row in an activity feed opens the task behind
  it, in the same detail panel the task board uses. Events where the overdue job
  flagged a task are shown in red.
- **Legal and consent** — Privacy, Terms and Cookies pages plus a simple
  cookie banner. The legal text is a genuine template, not legal advice; review
  it with counsel before production.
- **Reduced motion** — `prefers-reduced-motion` disables smooth scrolling,
  pulses and transitions.
- **Images** — there are no raster images in the app. The favicon and
  apple-touch icon are hand-written SVGs, so image compression is not
  applicable.

---

## Real-time design (WebSockets)

**Why Socket.io over native WebSocket:** it gives us room-based fan-out, an
auth handshake middleware (so the socket is rejected before it connects), an
automatic polling fallback, and client reconnect handling, with far less code
than hand-rolling those on top of a raw `WebSocket`.

### Rooms

| Room            | Who is in it                     | What it receives                          |
| --------------- | -------------------------------- | ----------------------------------------- |
| `user:<id>`     | every socket of one user         | personal feed rows, their notifications, and changes to their own tasks |
| `admin`         | all admins                       | global feed + live presence count         |
| `project:<id>`  | an admin or the PM who owns it   | board updates (`task:*`)                  |

A client joins a project room with `project:join`; the server re-checks access
before allowing the join. Only an admin and the owning PM qualify. A developer
is **never** admitted: a project room carries every task in the project, and a
developer may only read the tasks assigned to them. Their own task changes reach
them through their private `user:<id>` room instead, so the live channel is
exactly as wide as the REST scope and never wider. `project:leave` runs on
unmount.

### Events emitted after a DB write

`activity:new` (to the project room, the `admin` room, the PM, and the assigned
developer), `task:created` / `task:updated` / `task:deleted` (to the project
room and to the assignee's private room), `notification:new` and
`notification:count` (to the user), and `presence:count` (to admins).

### Missed events on reconnect

When a socket connects (including after being offline), the client invalidates
the activity query and re-fetches the **last 20 events from the database** via
`GET /api/activity?limit=20`. Activity is never reconstructed from an in-memory
cache, so a user who was offline still sees exactly what they missed within
their role scope. The socket buffer is only used to merge in brand-new rows
live, de-duplicated by `_id`.

### Presence

The server keeps a `userId -> socket count` map and broadcasts the number of
distinct online users to the `admin` room, which is what the admin dashboard
shows as "N online". Because the map counts people rather than connections, a
person with two tabs open counts once, and the number only ever reaches admins.

---

## Background job (overdue tasks)

**Why node-cron:** the scheduler runs inside the API process with no extra
infrastructure, and cron syntax is easy to read. For a single-instance agency
tool this is the right trade-off — a durable queue (BullMQ/Agenda) would only
be justified if the app scaled to multiple instances or needed retries.

`jobs/overdue.job.js` runs **every 5 minutes** (and once shortly after boot). It
finds tasks that are `isOverdue: false`, not `DONE`, and past due, flips
`isOverdue`, writes `MARKED_OVERDUE` activity rows, and sends `TASK_OVERDUE`
notifications to the developer and the owning PM. The flag is set with a
conditional update (`{ isOverdue: false }`), so concurrent runs cannot
double-flag a task.

Status changes and moving a due date into the future reset `isOverdue`, so a
task correctly stops being overdue without waiting for the next sweep.

---

## Notifications

Created server-side and stored in MongoDB:

- **Task assigned** → the developer.
- **Task moved to In Review** → the project manager.
- **Task overdue** → the developer and the PM (from the cron job).

The UI shows an unread **count badge** that expands into a dropdown. The count
is seeded from `GET /api/notifications/unread-count` and then kept fresh by the
`notification:new` / `notification:count` socket events — never by polling.
Notifications can be marked read individually or all at once, and the corrected
count is pushed to every open tab. A TTL index deletes notifications after 90
days.

---

## Database indexing decisions

Indexes are declared on the models and were chosen from the actual query
patterns (role scoping, list ordering, feeds, and the cron sweep).

| Model          | Index                                              | Why |
| -------------- | -------------------------------------------------- | --- |
| User           | `email` unique                                     | login lookup + duplicate prevention |
| Client         | `email` unique                                     | duplicate prevention |
| Project        | `{ client: 1, projectTitle: 1 }` unique            | a client may not have two projects with the same title |
| Project        | `{ projectManager: 1, createdAt: -1 }`             | PM dashboard/list: filter by manager, newest first |
| Project        | `{ client: 1 }`                                    | projects of a client |
| Task           | `{ project: 1, taskNumber: 1 }` unique             | task numbers unique within a project |
| Task           | `{ project: 1, status: 1, priority: 1 }`           | Kanban board and in-project filters |
| Task           | `{ assignedTo: 1, priorityRank: -1, dueDate: 1 }`  | developer dashboard: my tasks, priority then due date |
| Task           | `{ isOverdue: 1, dueDate: 1 }`                     | overdue cron sweep + admin overdue count |
| ActivityLog    | `{ task: 1, createdAt: -1 }`                       | one task's history |
| ActivityLog    | `{ project: 1, createdAt: -1 }`                    | PM/project feed, newest first |
| ActivityLog    | `{ assignedTo: 1, createdAt: -1 }`                 | developer feed |
| ActivityLog    | `{ createdAt: -1 }`                                | admin global feed |
| Notification   | `{ recipient: 1, isRead: 1, createdAt: -1 }`       | badge count + dropdown list |
| Notification   | `{ createdAt: 1 }` TTL 90 days                     | automatic cleanup |

`Task.priorityRank` is a numeric copy of the priority so that "sort by priority"
works in a single indexed sort (alphabetical "CRITICAL/HIGH/LOW/MEDIUM" order
would be wrong).

---

## Security model

- **Refresh token** is an HttpOnly, `SameSite=Strict` cookie (Secure in
  production). It is never readable by JavaScript and never stored in
  localStorage. Access tokens live only in memory and expire in 15 minutes.
- **Silent refresh** — an expired access token triggers one refresh and a
  replay of the request; a failed refresh signs the user out.
- **Role middleware on every protected route** (`authorize(...)`), plus
  query-level scoping in controllers so a modified token cannot widen access.
- **Password hashes** are `select: false` and stripped from JSON responses.
- **Self-lockout guards** — an admin cannot deactivate or demote their own
  account, and a PM who still owns projects cannot be moved to another role.
- **Secrets** live in `.env` (git-ignored); `.env.example` documents the keys.
- **Socket auth** happens in a handshake middleware; role and active status are
  re-read from the database so a deactivated account loses its socket.

### Verifying the authorization rules

Run `npm run test:authz` from `server/` with the API up. `scripts/authzTest.js`
signs in as an admin, two project managers and two developers, then attacks the
API rather than the UI: forged tokens (role rewritten, `userId` swapped,
`alg: none`, signed with the wrong secret, refresh token used as an access
token), every protected route without a token, and cross-tenant ids for tasks,
projects, activity and notifications. It asserts the allowed paths still work,
so a guard cannot pass by refusing everyone. One throwaway project is created
and deleted; nothing else is written.

`npm run test:authz:socket` covers the real-time half of the same rules with
`scripts/socketAuthzTest.js`: a socket with no token or a rewritten role is
refused at the handshake, a developer cannot join a project room even when it
holds their own task, a developer receives nothing about another developer's
task, and a developer still receives their own task and status changes live.
Two throwaway tasks are created and deleted.

`npm run test:project-task` checks the project and task behaviour itself with
`scripts/projectTaskTest.js`: an admin and a PM can create a project and attach
it to a client, a task carries every field with the right defaults, a status
change is written to the database with a timestamp and the user behind it
(and survives the task moving on, so it is stored rather than derived), a PM
reaches only their own projects, and — exercised across every read endpoint —
a task past its due date stays un-flagged until the scheduled job runs. It
creates two projects and a few tasks and removes them again.

`npm run test:dashboard` pins down the numbers the three dashboards are built
from with `scripts/dashboardTest.js`. The figures are only right if their source
is complete, ordered and scoped, so it asserts that `/api/tasks` answers with a
role's whole scope rather than a page, that the order is priority first and due
date second, that every task-list filter (status, priority, due range, project)
returns exactly the rows its own query parameter asks for — and rejects a stale
value instead of quietly ignoring it — and that the online count is live, sent
to admins only, and refcounted so one person's second tab is not a second
person. It also compares an unfiltered list to the same figure counted straight
from the database. It only reads; nothing is written.

### Known trade-off

`authMiddleware` trusts the `role` in the signed access token, so a demotion or
deactivation reaches the REST API only when that token expires (15 minutes at
most). The refresh endpoint and the socket handshake both re-read the user from
the database, so they cut the user off immediately. Re-reading the role on every
request would add a database round trip to every call.

---

## Validation and error handling

- Every write endpoint is validated server-side with **zod** (`validators/` +
  `middlewares/validate.middleware.js`). Unknown fields are rejected and the
  cleaned body is what reaches the controller.
- Every response uses one shape: `{ success, message, data? }`. Validation
  failures return `400` with an `errors: [{ field, message }]` array.
- A 404 handler and a final error handler guarantee a structured JSON response;
  raw stack traces are logged on the server and never sent to the client.

---

## API reference

Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/change-password
```

Users (admin)
```
POST   /api/users
GET    /api/users?role=&isActive=
GET    /api/users/developers          (admin, PM)
PATCH  /api/users/:id
```

Clients
```
POST   /api/clients                   (admin)
GET    /api/clients?isActive=         (admin, PM)
PATCH  /api/clients/:id               (admin)
DELETE /api/clients/:id               (admin, soft delete)
```

Projects (admin, PM)
```
POST   /api/projects
GET    /api/projects?status=&client=
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:projectId/tasks
```

Tasks (scoped by role)
```
GET    /api/tasks?status=&priority=&dueFrom=&dueTo=&project=
GET    /api/tasks/:id
PATCH  /api/tasks/:id                 (admin, PM)
PATCH  /api/tasks/:id/status          (all roles, own scope)
GET    /api/tasks/:id/activity
DELETE /api/tasks/:id                 (admin, PM)
```

Notifications
```
GET    /api/notifications?unread=true&limit=
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

Activity
```
GET    /api/activity?limit=20&before=<ISO>&project=
```

---

## Socket event reference

Client → server: `project:join` `(projectId, ack)`, `project:leave` `(projectId)`

Server → client:

| Event              | Room / target             | Payload                                  |
| ------------------ | ------------------------- | ---------------------------------------- |
| `activity:new`     | project, admin, PM, dev   | a feed row (actor, task, from→to, time)  |
| `task:created`     | project                   | populated task                           |
| `task:updated`     | project                   | populated task                           |
| `task:deleted`     | project                   | `{ _id }`                                |
| `project:created`  | admin, PM                 | populated project                        |
| `project:updated`  | admin, PM                 | populated project                        |
| `project:deleted`  | admin, PM                 | `{ _id }`                                |
| `notification:new` | user                      | `{ notification, unreadCount }`          |
| `notification:count` | user                    | `{ unreadCount }`                        |
| `presence:count`   | admin                     | `{ count }`                              |

---

## Assumptions

- A "project the PM created" is a project where that PM is the `projectManager`;
  reassignment is admin-only.
- The overdue sweep attributes `MARKED_OVERDUE` events to the project's PM,
  since a scheduled job has no acting user.
- Client deletion is a soft delete (`isActive: false`) so existing projects keep
  resolving their client.
- Projects with tasks cannot be hard-deleted, to avoid orphaned tasks.
