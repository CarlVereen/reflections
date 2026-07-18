# ⚡ Service Pro CRM — Google Sheets + Apps Script

A complete customer & job manager for service businesses (cleaners, landscapers,
detailers, contractors, trainers, handymen, HVAC, pool techs, movers, and more).
It lives entirely inside the **buyer's own Google account** — no subscriptions,
no servers, no data leaving their Drive.

This is the **product master**. Each sale is a *copy* of the finished sheet.

---

## What the buyer gets

It's an **app** (a private web-app URL) backed by a Google Sheet. Daily work happens in the
app — **Home / Clients / Jobs / Billing / More**. The sheet holds the data across these tabs:

| Sheet tab | What it stores |
|-----------|----------------|
| **Clients** | Contact book; status (Lead/Active/Inactive/Lost), address, follow-up date; **lifetime spend auto-calculates** from paid invoices. |
| **Jobs** | Scheduled work — date, **time**, service, status, a **Recurring** field, and a `CalendarEventID` linking each job to its Google Calendar event. |
| **Estimates** | Quotes (Draft/Sent/Accepted/Declined) with snapshotted tax + cached totals. |
| **Invoices** | Invoices (Draft/Sent/Paid/Overdue) traceable back to their estimate. |
| **LineItems** | Itemization for any estimate/invoice (snapshot description + rate). |
| **Services** | Your price book — service names + default rates. |
| **Business Settings** | Business info, currency, sales tax %, numbering, review link, payment link, **Google Calendar sync** toggle + default job length, accent color, logo. |

**Actions & automations (Apps Script):**
- **Local-first web app** — leads, clients, jobs, estimates, invoices, dashboard; instant on phone + desktop.
- **Estimates → invoices** — itemized branded **PDFs** with sales tax and a Pay-now button, emailed to the client; **Approve → invoice + job** in one tap.
- **Google Calendar sync** — scheduling/rescheduling/cancelling a job automatically creates/updates/removes its calendar event (client address as location). Toggle in Settings.
- **Maps directions** — one tap from a client's address opens Google Maps directions.
- **Recurring jobs** — `rollForwardRecurringJobs` auto-creates the next visit when a recurring job is done.
- **Review requests, follow-up digest (tap-to-text), appointment reminders, overdue-invoice flagging** — daily-trigger autopilot.
- **Mobile lead-capture Google Form** — `createLeadForm` builds a phone-friendly form that feeds Clients as new Leads.

> Container-bound project: the code files (`Code.gs`, `Api.gs`, `db.gs`, `setup.gs`, `WebApp.html`, `Sidebar.html`, optional `Tests.gs`) all travel with any copy of the sheet.

---

## How to build the master (one-time, ~5 min)

1. Create a new Google Sheet named **Service Pro CRM — MASTER**.
2. `Extensions ▸ Apps Script`. Add these files (or `clasp push` them — see `CLASP-SETUP.md`):
   - `Code.gs` (paste over the stub) — menu, automations, triggers, Form intake
   - `Api.gs` (new script file) — the web-app server API + calendar sync
   - `db.gs` (new script file) — schema + data layer
   - `setup.gs` (new script file) — builds/rebuilds the tabs
   - `WebApp` (new **HTML** file) — the app UI
   - `Sidebar` (new **HTML** file) — the desktop Quick Actions panel
   - `Tests.gs` (optional) — in-editor integration test
   Save.
3. Back in the sheet, reload the tab. A **⚡ CRM** menu appears.
4. Click **⚡ CRM ▸ Set up / rebuild database**. Approve the auth prompt once.
5. The 7 data tabs (+ hidden `_meta`) build themselves. That's the sheet/master.
6. **Set the timezone** (`Apps Script ▸ Project Settings ▸ Time zone`) and **deploy the web
   app** (one time) so the CRM runs as a phone/desktop app — see `DEPLOY.md`. Then run the
   smoke test in `SMOKE-TEST.md`.

## How to fulfill a sale (~60 seconds, repeatable)

1. Open the master → `File ▸ Make a copy` → name it `Service Pro CRM`.
2. `Share ▸ General access ▸ Anyone with the link ▸ Viewer`, then copy the link.
3. Deliver the link on the sales platform. The buyer does `File ▸ Make a copy`
   to get their own private, editable copy (the bound script comes with it).

> **Delivery note:** the Apps Script is *container-bound*, so it travels with any
> copy of the sheet automatically. Buyers authorize it in their own account the
> first time they open the ⚡ CRM menu — nothing runs under our account.

---

## Re-skinning for a niche (upsell / variety)

To ship niche editions (e.g. "Lawn Care CRM", "Cleaning Business CRM"):
- Set the accent color + seed services for the niche (Business Settings + the Services tab / price book).
- Adjust the seed service list in `setup.gs` (`DB_seedServices_`) if you want niche defaults.
- Rename the master and re-run **Set up / rebuild database**. New listing, same effort.
  (See `variants/README.md` for the per-edition specifics.)

---

## Owner setup checklist (the human parts only you can do)

- [ ] A Google account to hold the master sheet.
- [ ] A Gumroad account (free) **or** Square Online item / Etsy digital listing.
- [ ] Connect payouts (Square/Gumroad → bank).
- [ ] Approve the listing copy in `SALES.md`.
- [ ] Approve price (recommended: **$69** one-time; **$149** done-for-you setup tier).

Everything else — building, screenshots, copy, niche variants, support replies —
I draft. You approve and collect.
