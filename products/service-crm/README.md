# ⚡ Service Pro CRM — Google Sheets + Apps Script

A complete customer & job manager for service businesses (cleaners, landscapers,
detailers, contractors, trainers, handymen, HVAC, pool techs, movers, and more).
It lives entirely inside the **buyer's own Google account** — no subscriptions,
no servers, no data leaving their Drive.

This is the **product master**. Each sale is a *copy* of the finished sheet.

---

## What the buyer gets

| Tab | What it does |
|-----|--------------|
| 📊 **Dashboard** | Live KPIs — new leads (7 days), open pipeline value, jobs this week, revenue this month, win rate, lifetime revenue, a **follow-ups-due** list, and a 6-month revenue chart. Auto-updates. |
| 🎯 **Leads** | Pipeline with color-coded statuses (New → Contacted → Quoted → Won/Lost), estimated value, and follow-up dates that turn **red when overdue**. |
| 🗓️ **Jobs** | Scheduled work with status, price, paid flag, a **Repeat** column (recurring), and a **Photos** link → add to Google Calendar or create a before/after photo folder in one click. |
| 👥 **Clients** | Contact book; **Total Spent auto-calculates** from paid jobs. |
| 📄 **Estimates** | Quote log (Draft/Sent/Accepted/Declined) → one-click branded PDF. |
| 💵 **Invoices** | Invoice log (Draft/Sent/Paid/Overdue) → one-click branded PDF with tax + Pay-now. |
| 🧾 **Line Items** | Optional itemization for any estimate/invoice (Description / Qty / Rate). |
| ⚙️ **Settings** | Business info, currency, sales tax %, review link, payment instructions, payment link, follow-up window. |

**Actions & automations (Apps Script):**
- **⚡ Quick Actions panel** — add leads, see follow-ups, one-click sends.
- **Estimates & invoices** — itemized branded PDFs with sales tax and a Pay-now button, emailed to the client.
- **Recurring jobs** — `rollForwardRecurringJobs` auto-creates the next visit when a recurring job is done.
- **Google Calendar + photos** — `addJobToCalendar` puts a job on the owner's phone calendar; `createJobPhotoFolder` makes a shareable before/after Drive folder per job.
- **Review requests, follow-up digest (with tap-to-text links), appointment reminders, overdue-invoice flagging** — all on a daily-trigger autopilot.
- **Mobile lead-capture Google Form** — `createLeadForm` builds a phone-friendly form that feeds the Leads tab.

> Container-bound project needs **two files**: `Code.gs` and `Sidebar.html`.

---

## How to build the master (one-time, ~5 min)

1. Create a new Google Sheet named **Service Pro CRM — MASTER**.
2. `Extensions ▸ Apps Script`. Add **four files**:
   - `Code.gs` (paste over the stub) — sheet logic, menu, automations
   - `Api.gs` (new script file) — the web-app server API
   - `Sidebar` (new **HTML** file) — the desktop Quick Actions panel
   - `WebApp` (new **HTML** file) — the mobile web-app UI
   Save.
3. Back in the sheet, reload the tab. A **⚡ CRM** menu appears.
4. Click **⚡ CRM ▸ Set up / rebuild CRM**. Approve the auth prompt once.
5. The nine tabs build themselves. That's the sheet/master.
6. **Deploy the web app** (one time) so the CRM runs as a phone/desktop app — see
   `DEPLOY.md`. Then run the smoke test in `SMOKE-TEST.md`.

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
- Edit the `BRAND` color object at the top of `Code.gs`.
- Adjust the `Source` and service dropdowns in `buildLeads_`.
- Rename the master and re-run setup. New listing, same 10-minute effort.

---

## Owner setup checklist (the human parts only you can do)

- [ ] A Google account to hold the master sheet.
- [ ] A Gumroad account (free) **or** Square Online item / Etsy digital listing.
- [ ] Connect payouts (Square/Gumroad → bank).
- [ ] Approve the listing copy in `SALES.md`.
- [ ] Approve price (recommended: **$69** one-time; **$149** done-for-you setup tier).

Everything else — building, screenshots, copy, niche variants, support replies —
I draft. You approve and collect.
