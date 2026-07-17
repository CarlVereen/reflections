# Session Wrap-Up — Service Pro CRM clean rebuild + 4 reviews

**Date:** 2026-07-17 · **Repo/branch:** `carlvereen/reflections` @ `claude/revenue-idea-2k-pj7f90` · **Tip commit:** `8154e6d`

---

## TL;DR
Started the day fixing small UX bugs in the existing Service Pro CRM, then did a **ground-up rebuild
of the database layer onto a clean relational model** and rewrote the whole app on top of it — server
and front-end. Finished by running the rebuild through **four expert reviews** (database, security,
code, UX) and fixing every finding. The app is a Google Apps Script + Google Sheets CRM for solo
home-service businesses, sold as a packaged product. **111 sandbox assertions pass; deployable end-to-end.**

## What changed today (in order)
1. **Early polish (pre-rebuild):** logo→Drive mirroring for reliable PDF logos; home "This week's jobs"
   shows only active jobs (soonest first); made add-contact/add-job/delete **optimistic** (no read on
   change — the "local-first" model the owner wanted); fixed the "$X · draft" invoice-row text; stamp
   the invoice **issue date at approval**, not only on send.
2. **The rebuild (why):** the old app joined Jobs/Estimates/Invoices to people **by their text name** and
   used **cell formulas** (SUMIFS/QUERY) for totals and the dashboard. That's fragile (rename a client →
   broken links; formulas silently wrong; slow). Rebuilt onto **IDs + Script-owned values, zero formulas.**
3. **Reviews:** four independent passes, all findings fixed.

## The new architecture (the durable knowledge)
- **`SCHEMA` in `db.gs` is the single source of truth** — both the tab-builder (`setup.gs`) and the data
  layer read it, so build and access can't drift.
- **7 tables + hidden `_meta`:** Clients (a lead and a customer are the same row at different
  `Status`), Jobs, Estimates, Invoices, LineItems (fastest-growing), Services (price book),
  Business Settings (key/value incl. invoice numbering), `_meta` (ID counters like `EST-1001`).
- **Rules the design commits to:** join by **ID never name**; **no cell formulas**; money = raw number +
  `$` via cell format; dates = real Date; booleans = checkboxes; enums = dropdowns; **cached totals are
  Script-owned** (so reports never rescan LineItems); **snapshot pricing** (a line item copies
  description+rate from its Service at write, and the doc snapshots its own tax rate); **soft-delete
  only** (`Archived` flag); FK + enum validated in Script on every write.
- **ORM-lite pattern:** read a whole tab once per execution, write in one batch, every write under a
  reentrant `LockService` lock. Never `getRange()` in a per-row loop.
- **Dashboard is Script-computed** from the cached totals — no formulas anywhere in the workbook.

## The four reviews (what they caught)
- **Database expert (12 fixes):** biggest were **archive integrity** (FKs now reject archived parents;
  archiving a client/job with live children is blocked) and a **per-document tax-rate snapshot** (so
  changing the global tax % later can't retro-alter old docs). Plus auto-recalc of LifetimeSpent, cent
  rounding, immutable keys, an Invoice→Estimate link, and a pinned timezone.
- **Security:** a **critical** one I'd introduced — the web app was deployed **open to the entire
  internet** (`ANYONE_ANONYMOUS`); locked to **Only myself**. Also closed **formula/CSV injection** (a
  public lead-form name like `=IMPORTXML(...)` could execute in the owner's sheet), added a server-side
  logo-size cap, and escaped owner-set URLs in the PDF/email.
- **Code:** an **infinite refetch loop** in `openDoc` for a missing doc; `apiListClients` was **O(n²)**
  (would crawl at 1,000 clients) → made linear; optimistic "temp" rows could get **stuck saving** and
  block the write queue → added rollback; added error `.catch`es.
- **UX:** a **Paid invoice couldn't be un-marked** (accidental mark-paid was unrecoverable) → full status
  control; archive now confirms; the estimate builder previews **Subtotal + Tax + Total** so the number
  matches; due/valid dates shown; the estimate flow loads clients if you haven't opened that tab.

## Key decisions the owner made
- Expand the existing Settings tab into a single **Business Settings** table (not a second table).
- **Apply sales tax** to totals (Subtotal + Tax + Total columns), tax-inclusive lifetime.
- Skip the Payments/partial-payments table for now.
- Clean break — **no data migration** (owner has zero real data yet).

## State & how it was verified
- **6 app files** (`db.gs`, `setup.gs`, `Api.gs`, `Code.gs`, `WebApp.html`, `Sidebar.html`) +
  `appsscript.json`. ~1,860 lines total.
- **Verification:** no live Sheet in the build env, so everything ran in **fake-Sheets / headless-Chromium
  sandboxes** (committed in `tests/`): **db 38 · api 39 · code 15 · web 19 = 111 assertions, all green**,
  plus phone-width screenshots of every screen.

## Two things still to confirm on a REAL Google Sheet
1. Run **`setupDatabase()`** live and walk one full flow (Client→Estimate→Approve→Invoice→Paid).
2. Send **one test invoice with a logo** — confirms the Drive-hosted logo renders in Apps Script's
   HTML→PDF converter (the only thing the sandbox can't exercise).

## Pointers
- Resume note (state snapshot to continue after a clear): `HANDOFF.md`.
- Deploy steps: in `HANDOFF.md` §Deploy.
- The old marketing/deploy docs in this folder predate the rebuild and are now stale.
