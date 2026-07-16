# 🧭 Handoff / resume note — Service Pro CRM

Snapshot for resuming after a cleared conversation. **Everything below is committed & pushed.**

- **Repo / branch:** `carlvereen/reflections` · branch `claude/revenue-idea-2k-pj7f90`
- **Product dir:** `products/service-crm/`
- **As of commit:** `32d67c0` (self-healing Jobs tab + `Build` stamp). Working tree clean, level with origin.
- **Date of this snapshot:** 2026-07-16
- **Deployed build check:** Settings shows a `Build <date>` stamp (currently `2026-07-16b`). If it
  doesn't match the latest, you're on a stale deploy → cut a New version. (Jobs "empty" was a
  client stale-empty cache; server `apiListJobs` returns fine — confirmed 6 jobs in exec logs.)

## What this is
**Service Pro CRM** — a Google Apps Script web app (HtmlService single-page app in
`WebApp.html`, backed by Google Sheet tabs as the database) for solo/small home-service
businesses. Original goal: a packaged product to sell on Etsy + Gumroad ("a quick $2k").

## The three code files (paste-into-Apps-Script targets)
- `Code.gs` — sheet setup/build, menu, automations, archiving, `getSetting_`/`setSetting_`, helpers.
- `Api.gs` — web-app server API (`doGet`, all `api*` functions), PDF/doc helpers, dashboard.
- `WebApp.html` — the entire mobile SPA (UI + optimistic sync engine + mock preview layer).
- Also: `Sidebar.html` (desktop Quick Actions panel).

## ⚠️ Deploy reminder (bit us repeatedly)
The `/exec` web app serves the LAST-DEPLOYED version. After pasting code changes you must
**Deploy ▸ Manage deployments ▸ ✏️ ▸ New version**. Phase 1/2 changed only `WebApp.html`;
`Api.gs` last changed at commit `8b0f19b` (archiving/batching).

## Feature state — all DONE & pushed
Numbering (text+numeric) · duplicate warning · **Contacts** (merged Leads+Clients, deduped,
status/last-job tags, Name/Last-job sort) · inline edit (client rename cascades) · **Billing**
(merged Quotes+Invoices, collapsible Quotes/Outstanding/Paid/Closed groups) · Jobs promoted to
nav · schedulable approvals + job reschedule · invoice payment terms ("Due upon receipt" or
Net-days from send date) · delete/close stuck docs · Home tiles (Unpaid $ replaced Open
pipeline; Win rate kept w/ hint) · **archiving** (📦 Archived tabs; lifetime revenue carried,
monthly + Total Spent preserved, idempotent) · **optimistic UI + background sync**.

Nav (bottom): **Home · Contacts · Jobs · Billing · More**. Lead statuses: New / Quoted /
Declined / Lost (then last-job-date tag once they have a job).

## Performance / architecture (durable knowledge → see PERFORMANCE.md)
- Golden rule: cost = service calls, not JS. Batch reads/writes; read each sheet once; bundle
  round-trips (`apiBootstrap`, `apiListBilling`); memoized `getSetting_`.
- Killed a quadratic in `apiListDocs` (was re-reading Line Items per doc). Batched
  `appendLineItems_` (2 writes, not 2/line).
- **Client list caching** — revisiting a tab = 0 calls; `invalidate()` on change; only NON-empty
  caches are trusted (empty-cache bug fixed).
- **Optimistic UI + background write queue** (WebApp.html, `enqueue`/`syncPump`): local apply →
  instant render → background upload (sequential FIFO). Persisted to `localStorage` (edits),
  sync badge + loud success/fail + retry, `beforeunload` guard. Creates show "⏳ Saving"
  placeholder → reconcile to real number. Send/Approve/Delete/Add-contact stay synchronous.
- Deliberately NOT using server `CacheService` (Sheet changes outside the app via manual
  edits / lead Form / automations → would go stale).

## How verification was done (no live Sheet in cloud)
- Node `vm` sandboxes stub Apps Script globals (SpreadsheetApp/Utilities/PropertiesService) to
  run `Code.gs`/`Api.gs` against in-memory fake sheets.
- Headless Chromium (Playwright, `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) renders
  `WebApp.html` via its mock layer to drive flows + screenshot.

## Docs in the product dir
`PERFORMANCE.md` · `SMOKE-TEST.md` · `DEPLOY.md` · `LISTINGS.md` (Etsy/Gumroad copy) ·
`PACKAGE.md` · `LAUNCH-READINESS.md` · `ROADMAP.md` · `SECURITY.md` · `DATA-SECURITY.md`.

## Open threads / possible next steps (none blocking)
- Re-shoot Etsy/Gumroad listing screenshots with the new 5-tab layout.
- Optional: wire app → Google Calendar (owner's own calendar; CalendarApp; one-time re-auth).
- Optional at high volume only: archive very old *jobs* per-client (needs per-client carried
  Total Spent — deliberately deferred).
- Run the FULL live smoke test on a real Google account (the #1 launch gate).
- Personal `wrap-up` skill was uploaded but can't run in cloud (needs local Obsidian vault +
  Pinecone); a Master-Brain note for this session was generated separately.
