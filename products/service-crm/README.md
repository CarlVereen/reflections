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
| 📊 **Dashboard** | Live KPIs — new leads (7 days), open pipeline value, jobs this week, revenue this month, win rate, lifetime revenue, and a **follow-ups-due** list. Auto-updates. |
| 🎯 **Leads** | Pipeline with color-coded statuses (New → Contacted → Quoted → Won/Lost), estimated value, and follow-up dates that turn **red when overdue**. |
| 🗓️ **Jobs** | Scheduled work with status, price, and paid flag. |
| 👥 **Clients** | Contact book; **Total Spent auto-calculates** from paid jobs. |
| 💵 **Invoices** | Simple invoice log with Draft/Sent/Paid/Overdue statuses. |
| ⚙️ **Settings** | Business name, owner email, currency, default follow-up window. |

**Automations (Apps Script):**
- `⚡ CRM ▸ Add a lead` — guided lead entry with an auto-set follow-up date.
- `⚡ CRM ▸ Convert selected lead → client` — one click moves a won lead into Clients.
- `⚡ CRM ▸ Email me today's follow-ups` — sends the owner a formatted digest.
- `⚡ CRM ▸ Turn on daily 8am follow-up email` — installs a time-based trigger.

---

## How to build the master (one-time, ~5 min)

1. Create a new Google Sheet named **Service Pro CRM — MASTER**.
2. `Extensions ▸ Apps Script`. Delete the stub, paste **all of `Code.gs`**, Save.
3. Back in the sheet, reload the tab. A **⚡ CRM** menu appears.
4. Click **⚡ CRM ▸ Set up / rebuild CRM**. Approve the auth prompt once.
5. The six tabs build themselves. That's the master.

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
