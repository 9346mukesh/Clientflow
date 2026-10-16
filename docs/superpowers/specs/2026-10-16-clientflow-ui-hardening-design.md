# ClientFlow — UI Hardening & Design System Spec

Date: 2026-10-16
Status: Approved
Scope: `client/` only. No API changes.

## Goal

Take the frontend from "vibe coded" to deliberate and production-grade, and move
it to a restrained **monochrome graphite** aesthetic with no purple. Deliver the
33-item polish checklist (mobile, a11y, meta, legal, real-time UX).

## Design system

Neutral ramp only (no blue/purple tint).

| Token | Light | Dark |
| --- | --- | --- |
| page / surface / surface-2 | `#FAFAFA` / `#FFFFFF` / `#F5F5F5` | `#0A0A0A` / `#141414` / `#1C1C1C` |
| line / line-strong | `#E5E5E5` / `#D4D4D4` | `#262626` / `#333333` |
| ink / muted / faint | `#171717` / `#525252` / `#737373` | `#F5F5F5` / `#A3A3A3` / `#737373` |
| action / hover / on-action | `#171717` / `#000000` / `#FAFAFA` | `#FAFAFA` / `#FFFFFF` / `#0A0A0A` |
| danger / warning / success | `#B91C1C` / `#B45309` / `#15803D` | `#F87171` / `#FBBF24` / `#4ADE80` |

Colour is reserved for status/priority chips, validation errors and destructive
actions. Links and the active nav are graphite + underline. Priority is encoded
by weight (outline → tint → solid → danger).

Type: **Space Grotesk** (display), **IBM Plex Sans** (body), **IBM Plex Mono**
(data: task numbers, counts, timestamps, eyebrows).

Layout: light hairline sidebar with a 2px graphite active marker; mobile top bar
(56px) + slide-over drawer.

Signature: a 2px graphite progress hairline (scroll progress + indeterminate
during in-flight navigation/queries) and monospace eyebrow counters with real
totals (e.g. `PROJECTS · 03`).

Motion: 120–160ms; `prefers-reduced-motion` disables pulse, smooth scroll and
transitions.

## Deliverables (all frontend)

1. **Theme** — CSS variable tokens in `index.css`, `@custom-variant dark`,
   fonts, base styles, focus-visible rings, overflow-x guard.
2. **Meta/identity** — favicon set, `theme-color`, meta description, per-route
   `document.title` + description hook, pre-paint theme script (default light).
3. **Shell** — theme-toggle, light sidebar, mobile drawer (focus trap + Esc),
   footer (legal links + dynamic copyright + `mailto:`), scroll progress,
   back-to-top, clickable logo.
4. **Primitives** — toast provider (success/error), form field error states,
   password visibility toggle, skeleton loaders, confirm dialog, consistent
   hover/focus.
5. **Legal** — `LegalLayout` + Privacy, Terms, Cookie pages (template text,
   marked as such) and a simple cookie banner with localStorage consent.
6. **Search** — role-scoped ⌘K/Ctrl-K overlay over projects, tasks, clients,
   users (client-side filter of already-scoped endpoints).
7. **Passes** — responsive/overflow audit on every page (tables → cards under
   `md`), button/ link audit (no dead links or no-op buttons), custom 404,
   404/empty/loading states, contrast audit to AA.

Images: no raster assets exist. SVG assets are minified; image compression is
not applicable.

## Sequencing

theme → shell → primitives → legal → search → per-page responsive/overflow →
dark-mode + keyboard + contrast verification → build/lint → browser checks.

## Non-goals

- No backend/API changes.
- Legal text is a genuine template, not legal advice.
