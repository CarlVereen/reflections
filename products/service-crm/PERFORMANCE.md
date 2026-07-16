# ⚡ Performance notes — how this app stays fast (and how experts speed up Apps Script)

The #1 rule of Google Apps Script performance: **the slow part is the calls to Google's
services, not the JavaScript.** Every `getValue()`, `setValue()`, `getRange()`,
`getSheetByName()`, `MailApp.sendEmail()`, and every `google.script.run` call crosses a
network/service boundary that costs tens to hundreds of milliseconds. JS loops and math are
essentially free by comparison. So the whole game is: **make fewer service calls, and move
more data per call.**

Below are the techniques the pros use, and exactly where each is applied here.

---

## 1. Batch reads and writes (never per-cell in a loop)
Reading 1,000 cells with `getValue()` in a loop = 1,000 service calls. Reading the same
range once with `getValues()` = **1 call**. Same for `setValues()` vs `setValue()`.

- **Applied:** every list read uses one `getRange(...).getValues()` over the whole range
  (`valuesOf_`), not per-row reads. Bulk writes (`apiSaveServices`, the client-rename
  cascade `renameClientEverywhere_`) read a column once and write it back once with
  `setValues()`.
- **Rule of thumb:** if you're calling a Sheets method inside a `for` loop, stop and batch it.

## 2. Read each sheet once per request, then work in memory
Re-reading the same sheet multiple times in one operation is pure waste.

- **Applied — `apiListDocs`:** it *used* to count line items by calling `lineItemsFor_` once
  **per document**, and each of those re-read the entire Line Items sheet. With N invoices
  that was N full scans — O(N × items), which is why it got slower as data grew. The count
  wasn't even displayed, so it's gone. Listing quotes/invoices is now a single sheet read.
- **Applied — settings memo:** `getSetting_` reads the Settings sheet **once per execution**
  and serves every later lookup from memory (`settingsMap_`). One invoice PDF reads ~8
  settings → was 8 sheet reads, now 1. `setSetting_` clears the memo so writes stay correct.

## 3. Bundle client → server round-trips
Each `google.script.run` call has real latency (auth + cold-start overhead). Fewer, fatter
calls beat many small ones.

- **Applied — `apiBootstrap`:** one call returns settings, services, the dashboard, and all
  the status lists, so the app boots from a single round-trip.
- **Applied — `apiListBilling`:** the Billing screen returns estimates **and** invoices in
  one call (was two).

## 4. Cache fetched lists in the app; only refetch after a change
The biggest everyday win. The app keeps each list in memory (`S.contacts`, `S.jobs`,
`S.quotes`, `S.invoices`, `S.dashboard`). Switching tabs renders from that cache with **zero
server calls**. Any action that writes to the sheet calls `invalidate()`, which clears the
caches so the next view refetches fresh data. The ⟳ Refresh button clears everything.

- **Net effect:** navigating around the app is instant; you only pay for a server call on the
  first view of a tab and right after you change something — which is unavoidable anyway.

## 5. Don't interleave reads and writes unnecessarily
Reading right after a write can force Apps Script to flush pending writes, adding latency.

- **Applied — `apiSetJob`:** after writing the new date it returns the value it just computed
  instead of reading the cell back.

## 6. Why we do **not** use server-side `CacheService` for the data
Apps Script offers `CacheService` (store JSON server-side for up to 6 hours). It's tempting,
but this CRM's source of truth is the **Sheet**, which can change *outside* the app: you can
edit a tab by hand, the mobile lead **Form** appends rows, and the daily **automations**
write on a schedule. A server cache has no way to know those happened, so it would serve
**stale data** with no reliable way to invalidate. The client-side cache (§4) is safe because
it's per-session, is cleared on every in-app change, and you can always tap ⟳. If this ever
becomes multi-user with heavy read load, revisit CacheService with an explicit
version/invalidation key.

---

## Capacity note (worth knowing as you grow)
The data tabs are built with 500 formatted rows. That's plenty for a solo business for years,
but it's not infinite. When a tab approaches its limit, add rows in the sheet (Insert ▸ Rows)
— the app reads by actual content, so more rows just work. Deleting stuck quotes/invoices
(Billing ▸ open a doc ▸ Delete) also frees space. If you ever run a very high volume,
archiving paid/closed rows to a separate sheet keeps the live tabs lean and fast.

## Quick checklist if something feels slow
1. Is a Sheets call inside a loop? Batch it with `getValues`/`setValues`.
2. Is the same sheet read more than once per request? Read once, reuse.
3. Can two `google.script.run` calls become one server function? Bundle them.
4. Did a new list view get added without caching? Give it an `S.*` cache + `invalidate()`.
5. Redeploy a **new version** after code changes, or you're testing the old one.
