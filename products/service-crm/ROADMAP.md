# Roadmap: from the expert service-CRM review

Prioritized by **impact per effort**. All items are feasible within Google Sheets +
Apps Script unless noted. This is the backlog that most raises perceived value and cuts refunds.

## Positioning fixes (done)
- [x] Correct "works on your phone" → honest desktop/mobile split (TRAINING.md)
- [x] "Please read before buying" honesty block on the Etsy listing (LISTINGS.md):
      Sheets-not-an-app, email-not-SMS, no built-in card payments/auto-quotes yet.

## Product backlog (highest value first)

### ✅ P1: Quotes / Estimates  (DONE)
Shared PDF engine (`generateDoc_`) now produces both estimates and invoices. New
📄 Estimates tab; `Create & email estimate` stamps ESTIMATE with a "Valid until" date.

### ✅ P2: Itemized invoices + tax  (DONE)
New 🧾 Line Items tab (Doc # / Description / Qty / Rate / Line Total). Invoices &
estimates pull matching items, apply a Sales tax % from Settings, and show
subtotal / tax / total. A single typed Amount still works (treated as the total,
no double-taxing on re-run).

### ✅ P3: Recurring / repeat jobs  (DONE)
Jobs gained a "Repeat" column (Weekly/Biweekly/Monthly) + internal "Rolled?" flag.
`rollForwardRecurringJobs` (daily trigger) auto-creates the next visit when a
recurring job is marked Done. Idempotent; never spawns twice.

### ✅ P4: Pay-now link + SMS fallback  (DONE)
- Settings "Payment link" renders a **Pay now** button in invoices (PDF + email).
- The follow-up digest email now has a tap-to-text **"Text ›"** `sms:` link per lead that
  works on the phone where they read it, sidestepping the Twilio wall.

### ✅ P5: Mobile lead capture via Google Form  (DONE)
`Create mobile lead-capture form` builds a Google Form (great on phones) whose
submissions flow straight into the Clients tab (as new Leads) via an onFormSubmit trigger. URL is
saved to Settings to bookmark on a phone.

## Post-launch-research decisions (voice-of-customer review)

Validated the build against real demand (Reddit/forums/Quora/X + review-site
complaints). Verdict: **simplicity + no-subscription + own-your-data is the wedge**,
so we closed only the two highest-leverage feasible gaps and deliberately stopped,
to avoid bloating the one thing users praise most.

### ✅ Closed
- **Google Calendar**: `addJobToCalendar` pushes a Job to the owner's Google Calendar,
  which IS their phone's schedule/day view (better than a cramped in-sheet calendar).
- **Before/after photos**: `createJobPhotoFolder` makes a shareable Drive folder per
  job and links it in the new Jobs "Photos" column. Big for cleaning/lawn niches.

### ⏸️ Deliberately deferred (would add tabs/complexity; add only if buyers ask)
- Deposits / balance-due on invoices (niche to higher-ticket trades).
- Expense / mileage tab (modest demand).
- "Assigned To" column (only matters after they hire helper #1).

### 🚫 Out of scope for a Sheet (disclose, don't build)
Native 2-way SMS from a business number, in-app card processing / tap-to-pay,
availability-based online booking, real-time QuickBooks sync, GPS routing/dispatch.
These are why $50/mo apps exist; a $69 Sheet can't imitate them without breaking.

## Notes on hard limits (set expectations, don't try to hide)
- Custom menu + sidebar are **desktop-web only** (not in the Sheets mobile app).
- No native SMS (paid gateway required); use the `sms:` tap-to-send fallback.
- No card processing in-sheet; use payment links.
