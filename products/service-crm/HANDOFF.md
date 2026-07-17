# 🧭 HANDOFF — Service Pro CRM (clean rebuild)

Resume note for picking this back up after a context clear. **Everything below is committed & pushed.**

- **Repo / branch:** `carlvereen/reflections` · branch `claude/revenue-idea-2k-pj7f90`
- **As of commit:** `8154e6d` (UX review fixes). Working tree clean, level with origin.
- **Date:** 2026-07-17
- **What this is:** a Google Apps Script + Google Sheets CRM for a solo/small home-service business,
  sold as a packaged product. This session was a **clean rebuild onto a new relational data model**
  (was name-joined + cell-formula; now **ID-joined, Script-owned, no formulas**), followed by **four
  reviews** (database, security, code, UX), all fixed.

## The app is 6 files (paste each into the Apps Script project)
| File | Lines | Role |
|---|---|---|
| `db.gs` | ~400 | Data layer. `SCHEMA` registry (single source of truth) + ORM-lite: read-once/write-batch, script lock, `insert`/`insertMany`/`getById`/`getAll`/`query`/`update`/`softDelete`, `recalcDocTotal`/`recalcClientLifetime`, `nextId`/counter helpers, key/value settings. |
| `setup.gs` | ~115 | `setupDatabase()` builds all tabs from SCHEMA (headers, freeze, dropdowns, checkboxes, formats, seeds). Also `resetDatabase()`, `verifySchema()`. |
| `Api.gs` | ~477 | Web API (`doGet` + all `api*`), ID-based, script-computed dashboard, snapshot pricing, PDF/email, logo→Drive. Self-contained `API_*` helpers. |
| `Code.gs` | ~232 | Menu (`onOpen`), 5 automations (overdue / recurring roll-forward / follow-up digest / reminders / review requests), daily triggers, Google-Form intake (`onFormSubmit`), sidebar helpers. |
| `WebApp.html` | ~563 | Mobile SPA. Bottom nav (Home/Clients/Jobs/Billing/More), tabs, fixed action bar, optimistic sync engine, accent theme, logo upload. Built-in preview `mock()` for standalone render. |
| `Sidebar.html` | ~72 | Desktop Quick Actions (capture a lead, see due follow-ups). |
| `appsscript.json` | — | Manifest: `timeZone` (set to owner's tz!), V8, **web app access = MYSELF**. |

## Data model (7 tabs + hidden `_meta`)
`Clients` (Status = Lead|Active|Inactive|Lost — no separate Leads tab) · `Jobs` · `Estimates` ·
`Invoices` · `LineItems` (fastest-growing; polymorphic `DocID` per `DocType`) · `Services` (price book) ·
`Business Settings` (key/value: profile, tax, payment, **invoice numbering**, brand) · `_meta` (ID counters).

**Non-negotiables, all in force:** join by **ID** never name · **no cell formulas** (Script writes every
value) · money=number + `$` via format · dates=real Date · booleans=checkboxes · enums=dropdowns ·
cached totals Script-owned (`Estimates/Invoices.Subtotal/Tax/Total`, `LineItems.LineTotal`,
`Clients.LifetimeSpent`) · **snapshot pricing** (LineItem copies Desc+Rate from Service at write) ·
**per-doc `TaxRate` snapshot** · **soft-delete** via `Archived` · FK+enum validated on write (rejects
archived parents; Service refs exempt) · formula/CSV-injection guard on text writes.

## Verification (no live Sheet in the build env)
Fake-Sheets/headless sandboxes in `tests/` — **111 assertions, all green** (db 38 · api 39 · code 15 · web 19).
Run: `node tests/dbtest.js` / `apitest.js` / `codetest.js` / `webtest.js` from `products/service-crm/`.
These prove logic/flow, **not** live Apps Script behavior.

## Deploy (owner steps)
1. Paste all 6 files into the bound Apps Script project.
2. Reload sheet → **⚡ CRM ▸ Set up / rebuild database** (builds fresh tabs; destructive on existing data).
3. **⚡ CRM ▸ Turn ON daily autopilot** (installs triggers — authorize email/Drive once).
4. **Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me · Who has access: Only myself ▸ Deploy.**
5. In Apps Script **Project Settings**, set the **time zone** to the owner's locale.

## ⚠️ Still to confirm on a REAL sheet (the two open items)
1. Run `setupDatabase()` live and eyeball the tabs + one full flow (Client→Estimate→Approve→Invoice→Paid).
2. **PDF logo**: send one test invoice with a logo set — confirms the Drive-hosted image renders in the
   Apps Script HTML→PDF converter (the one thing the sandbox can't exercise).

## The four reviews (all fixed — see commits a7545e6, a0e1740, 3faf504, 8154e6d)
- **Database:** archive integrity (reject archived-parent FKs; block/guard parent archive), per-doc tax
  snapshot, auto-recalc lifetime on paid-invoice change, cent rounding, immutable DocType/PK, Invoice→
  Estimate link, numeric-setting sanitize, timezone manifest.
- **Security:** web-app access `MYSELF` (was ANYONE_ANONYMOUS — critical), formula/CSV-injection guard,
  server-side logo size cap, escaped URLs in PDF/email.
- **Code:** fixed `openDoc` infinite refetch loop, `apiListClients` O(n²)→O(n), optimistic-temp rollback
  on failure (+queue unblock), silent-failure `.catch`es.
- **UX:** full status control on invoice/estimate detail (un-pay a mis-marked invoice), archive
  confirmations, live Subtotal+Tax+Total in the estimate builder, due/valid dates, pickClient loads
  clients first.

## Notes / possible next steps (none blocking)
- Old docs in this dir (`PERFORMANCE.md`, `DEPLOY.md`, `SMOKE-TEST.md`, `LISTINGS.md`, marketing HTML)
  describe the PRE-rebuild app — stale; update if productizing.
- Deferred by design: `Payments` table (partial payments) — skipped; `LineItems_Archive` yearly move
  when the tab nears ~50k rows (~year 3); `apiApproveEstimate` is non-atomic (Sheets has no transactions).
- Wrap-up narrative for the Obsidian vault: `SESSION-WRAPUP-2026-07-17.md`.
