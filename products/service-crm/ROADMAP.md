# Roadmap — from the expert service-CRM review

Prioritized by **impact per effort**. All items are feasible within Google Sheets +
Apps Script unless noted. This is the backlog that most raises perceived value and cuts refunds.

## Positioning fixes (done)
- [x] Correct "works on your phone" → honest desktop/mobile split (TRAINING.md)
- [x] "Please read before buying" honesty block on the Etsy listing (LISTINGS.md):
      Sheets-not-an-app, email-not-SMS, no built-in card payments/auto-quotes yet.

## Product backlog (highest value first)

### ✅ P1 — Quotes / Estimates  (DONE)
Shared PDF engine (`generateDoc_`) now produces both estimates and invoices. New
📄 Estimates tab; `Create & email estimate` stamps ESTIMATE with a "Valid until" date.

### ✅ P2 — Itemized invoices + tax  (DONE)
New 🧾 Line Items tab (Doc # / Description / Qty / Rate / Line Total). Invoices &
estimates pull matching items, apply a Sales tax % from Settings, and show
subtotal / tax / total. A single typed Amount still works (treated as the total,
no double-taxing on re-run).

### ✅ P3 — Recurring / repeat jobs  (DONE)
Jobs gained a "Repeat" column (Weekly/Biweekly/Monthly) + internal "Rolled?" flag.
`rollForwardRecurringJobs` (daily trigger) auto-creates the next visit when a
recurring job is marked Done. Idempotent — never spawns twice.

### ✅ P4 — Pay-now link + SMS fallback  (DONE)
- Settings "Payment link" renders a **Pay now** button in invoices (PDF + email).
- The follow-up digest email now has a tap-to-text **"Text ›"** `sms:` link per lead —
  works on the phone where they read it, sidestepping the Twilio wall.

### ✅ P5 — Mobile lead capture via Google Form  (DONE)
`Create mobile lead-capture form` builds a Google Form (great on phones) whose
submissions flow straight into the 🎯 Leads tab via an onFormSubmit trigger. URL is
saved to Settings to bookmark on a phone.

## Strong follow-ons (next tier)
- Google Calendar sync / a real "today & this week" schedule view of Jobs.
- Before/after photo field on jobs (Drive-folder link column).
- "Assigned To" column (ready for helper #1).
- Expense / mileage tab for tax time.
- Deposits / balance-due on invoices.

## Notes on hard limits (set expectations, don't try to hide)
- Custom menu + sidebar are **desktop-web only** (not in the Sheets mobile app).
- No native SMS (paid gateway required) — use the `sms:` tap-to-send fallback.
- No card processing in-sheet — use payment links.
