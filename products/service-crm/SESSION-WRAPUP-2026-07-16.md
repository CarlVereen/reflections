# 📋 Session wrap-up — Service Pro CRM (2026-07-16)

**Goal:** Turn "Service Pro CRM" into a genuinely good, sellable product — a Google Apps Script
web app (HtmlService SPA + Google Sheet as the database) for solo/small home-service
businesses. North star: "a quick $2k" by selling it on Etsy/Gumroad.

- **Repo:** `carlvereen/reflections` · **branch:** `claude/revenue-idea-2k-pj7f90`
- **Product dir:** `products/service-crm/` · **Resume anchor:** `HANDOFF.md`

## What we shipped (in order)
1. **Configurable doc numbering** — text or numeric (e.g. `INV-001`), prefix + zero-padding preserved.
2. **Duplicate warning** (warn, not block) on matching email/phone.
3. **Follow-up dates made visible** with one-tap reschedule.
4. **Inline edit** for leads/clients; client rename cascades across jobs/estimates/invoices.
5. **Merged Quotes + Invoices → one Billing screen** (collapsible Quotes / Outstanding / Paid /
   Closed groups); promoted **Jobs** to the main nav.
6. **Merged Leads + Clients → one Contacts screen** — deduped by name; status tags
   (New/Quoted/Declined/Lost) that flip to a **last-job-date** tag once someone's a client;
   sort by Name or Last job.
7. **Schedulable approvals + job rescheduling.**
8. **Invoice payment terms** — Net-days from send date, or "Due upon receipt."
9. **Delete / close stuck docs.**
10. **Dashboard tiles** — replaced "Open pipeline" with **Unpaid $**; kept Win rate (redefined + hinted).
11. **Archiving** — closed quotes + old paid invoices → 📦 Archived tabs, with lifetime revenue
    carried forward and monthly / Total-Spent preserved.
12. **Optimistic UI + background sync** (2 phases) — instant local updates, background upload,
    persisted queue, sync badge + loud success/fail, and "⏳ Saving" placeholders for new
    estimates that reconcile to the real number.
13. **Build stamp** in Settings to catch stale deploys.

## Key engineering decisions (durable knowledge)
- **Apps Script's cost is service calls, not JS** → batch reads/writes, read each sheet once,
  bundle round-trips, memoize settings. Killed a quadratic in `apiListDocs`.
- **Client-side list caching** (revisit a tab = 0 calls), invalidated on change.
- **Optimistic writes** are safe here specifically because it's a small team with no concurrent
  edits on the same record → no merge conflicts.
- **Deliberately did NOT use server-side CacheService** — the Sheet changes outside the app
  (manual edits, lead Form, automations), so it'd go stale.
- **Send / Approve / Delete / Add-contact stay synchronous** by design (money/email/dedup need
  confirmation).

## Bugs found & fixed
- Row-502 client drop (append past pre-filled formulas).
- Formula/CSV injection, email HTML injection, clickjacking (security review).
- Multi-Google-account desktop "can't open file" (documented, not code).
- **Jobs tab empty** — traced to a client-side *stale empty cache* (an empty `[]` treated as
  "loaded"); server was always fine (exec log confirmed `returning 6 jobs`).

## Where it's saved
- HEAD at time of this note: fully committed & pushed to
  `origin/claude/revenue-idea-2k-pj7f90`.
- Reference docs: `HANDOFF.md`, `PERFORMANCE.md`, `SMOKE-TEST.md`, `DEPLOY.md`, `LISTINGS.md`,
  `SECURITY.md`, `DATA-SECURITY.md`, `ROADMAP.md`, `LAUNCH-READINESS.md`.
- Code to deploy: `Code.gs`, `Api.gs`, `WebApp.html`, `Sidebar.html`.
- Verification method (no live Sheet in cloud): Node `vm` sandboxes stubbing Apps Script globals
  to run `Code.gs`/`Api.gs` against fake in-memory sheets; headless Chromium (Playwright) to
  render `WebApp.html` via its mock layer and drive flows / screenshot.

## Open threads (none blocking)
- Run the **full live smoke test** on a real Google account (the #1 launch gate).
- Re-shoot Etsy/Gumroad listing screenshots with the new 5-tab layout.
- Optional: wire the app to Google Calendar (owner's own calendar; easy — CalendarApp).
- Optional at high volume only: archive very old *jobs* per client (needs per-client carried
  Total Spent — deliberately deferred).
- Personal `wrap-up` skill (Obsidian + Pinecone) was uploaded but can't run in the cloud
  container; a Master-Brain note for this session was generated separately.
