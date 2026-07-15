# Roadmap — from the expert service-CRM review

Prioritized by **impact per effort**. All items are feasible within Google Sheets +
Apps Script unless noted. This is the backlog that most raises perceived value and cuts refunds.

## Positioning fixes (done)
- [x] Correct "works on your phone" → honest desktop/mobile split (TRAINING.md)
- [x] "Please read before buying" honesty block on the Etsy listing (LISTINGS.md):
      Sheets-not-an-app, email-not-SMS, no built-in card payments/auto-quotes yet.

## Product backlog (highest value first)

### P1 — Quotes / Estimates  ⭐ biggest expectation gap, low effort
Clone the existing invoice PDF engine into "Create & email estimate." Stamp ESTIMATE,
pull from Leads/a Quotes tab. Makes the existing "Quoted" pipeline stage real.

### P2 — Itemized invoices + tax
Line items (description / qty / rate) + a tax % from Settings, summed in the PDF.
Turns the weakest artifact (one-line invoice) into something professional.

### P3 — Recurring / repeat jobs  ⭐ existential for Cleaning & Lawn Care
"Repeat every: weekly/biweekly/monthly" column + a daily trigger that auto-creates the
next job when one is marked Done. Without this, the two flagship niches fight the tool.

### P4 — Pay-now link + SMS fallback  (kills two loud complaints, low effort)
- Settings "Payment link" (their Stripe/Square/PayPal.me/Venmo) → rendered as a button
  in the invoice email/PDF. No processing integration — just a link.
- Sidebar "Text this client" → builds an `sms:` link with a pre-filled reminder/review
  message they tap to send from their own phone. Sidesteps the Twilio wall.

### P5 — Honest mobile capture: Google Form for "Add a lead"
A linked Google Form (works perfectly on phones, unlike the desktop-only sidebar) that
feeds the Leads tab. Gives a real driveway lead-capture path.

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
