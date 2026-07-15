# ✅ Smoke test — Service Pro CRM

Run this once when you paste the code into a real Google account (building the
master sheet). ~10 minutes. It exercises every feature that can only be verified
live. Check each box; if one fails, note the step number and send it to me.

---

## A. Install & build
- [ ] **A1.** New Google Sheet → `Extensions ▸ Apps Script`. Paste **all of `Code.gs`** into `Code.gs`.
- [ ] **A2.** Add a file → HTML → name it **`Sidebar`** → paste **all of `Sidebar.html`**. Save the project.
- [ ] **A3.** Reload the sheet. A **⚡ CRM** menu appears at the top. *(If not: re-check the project saved.)*
- [ ] **A4.** `⚡ CRM ▸ Set up / rebuild CRM`. Approve the Google authorization prompt (Advanced → Go to project → Allow).
- [ ] **A5.** Confirm **7 tabs** exist in order: 🚀 Start Here, 📊 Dashboard, 🎯 Leads, 🗓️ Jobs, 👥 Clients, 💵 Invoices, ⚙️ Settings — and there is **no leftover "Sheet1"**.
- [ ] **A6.** 🚀 Start Here shows the welcome + 5 checkboxes. 📊 Dashboard shows KPI tiles and a **revenue chart** (chart is present, not a blank box).

## B. Settings
- [ ] **B1.** ⚙️ Settings is pre-filled. Set **Business name**, **Owner email** (your address), **Business phone**, **Google review link** (any real URL for testing), and **payment instructions**.

## C. Leads (menu + sidebar)
- [ ] **C1.** `⚡ CRM ▸ Open Quick Actions panel` — the branded sidebar opens on the right.
- [ ] **C2.** In the panel, add a lead (name + email = **your own email** so later tests can send to you). Toast says "✅ Added…", and the row appears in 🎯 Leads with a **Next Follow-up** date auto-set.
- [ ] **C3.** In 🎯 Leads, set that lead's **Next Follow-up** to **today or earlier**. The date cell turns **red**.
- [ ] **C4.** In the panel, click **↻ Refresh** under "Follow-ups due" — the lead now appears there.

## D. Jobs, clients & the lead→client link
- [ ] **D1.** Click the lead's row in 🎯 Leads → `⚡ CRM ▸ Add & convert ▸ Schedule a job from selected lead`. Enter a date like **today's date in M/D/YYYY**.
- [ ] **D2.** A row appears in 🗓️ Jobs (Status = Scheduled), the lead is marked **Won**, **and the person now appears in 👥 Clients with their email** (this is the fix — confirm the email carried over).
- [ ] **D3.** In 🗓️ Jobs, set that job **Status = Done** and **Paid? = Yes**. In 👥 Clients, that client's **Total Spent** updates to the job price.

## E. Invoices (PDF + currency)
- [ ] **E1.** 💵 Invoices → add a row: invoice # (e.g. 1001), Client = the same name, an amount, dates.
- [ ] **E2.** Click the row → `⚡ CRM ▸ Invoices ▸ Create & email invoice` → choose **Yes** to email.
- [ ] **E3.** Check your inbox: the **PDF invoice arrives**, the header shows business name (left) and "INVOICE" (right) **side by side**, and the amount uses your currency symbol. The invoice row is now **Sent**, and a copy is in your Drive.
- [ ] **E4.** Set an invoice's **Due Date to yesterday** and Status = **Sent**, then `⚡ CRM ▸ Invoices ▸ Flag overdue invoices` → it flips to **Overdue** (red).

## F. Automations (emails)
- [ ] **F1.** `⚡ CRM ▸ Automations ▸ Send review requests for finished jobs` → you (as the test client) receive the **⭐ review-request email**; the job's **Review Sent?** flips to Yes. Running it again sends **nothing** (no duplicate).
- [ ] **F2.** `⚡ CRM ▸ Automations ▸ Email me today's follow-ups` → you receive the **🔔 follow-up digest**.
- [ ] **F3.** In 🗓️ Jobs, add a job dated **tomorrow** for your test client (Status = Scheduled). `⚡ CRM ▸ Automations ▸ Send tomorrow's appointment reminders` → you receive the **📅 reminder**; **Reminder Sent?** flips to Yes.
- [ ] **F4.** `⚡ CRM ▸ Automations ▸ Turn ON daily automations` → confirmation alert. Check `Extensions ▸ Apps Script ▸ Triggers` shows **3 time-based triggers**. Then **Turn OFF** → they're removed.

## G. Safety guard
- [ ] **G1.** With data now in the sheet, run `⚡ CRM ▸ Set up / rebuild CRM` again → a **warning dialog** asks before erasing. Click **No** → nothing is wiped. *(This protects real data — do not click Yes on your live sheet.)*

## H. Estimates + itemized + tax (new)
- [ ] **H1.** In ⚙️ Settings set **Sales tax %** (e.g. 8.25) and a **Payment link** (any URL) and **Currency symbol**.
- [ ] **H2.** In 🧾 Line Items add 2–3 rows with the same **Doc #** (e.g. 1001), each with Description / Qty / Rate. Confirm **Line Total** auto-calculates.
- [ ] **H3.** In 📄 Estimates add a row: Estimate # = 1001, Client = your test client, dates. Click it → `⚡ CRM ▸ Invoices & estimates ▸ Create & email estimate` → you receive an **ESTIMATE** PDF that is **itemized**, shows **subtotal + tax + total**, and says "Valid until".
- [ ] **H4.** In 💵 Invoices add a row: Invoice # = 1001, same client. Create & email invoice → **INVOICE** PDF, itemized, with tax, a **Pay now** button (your link), marked **Sent**, Amount column updated to the total.
- [ ] **H5.** Run Create & email invoice on the **same row again** → the total is the **same** (tax not applied twice). ✅ this verifies the no-double-tax fix.
- [ ] **H6.** Add an invoice with **no** line items but a typed **Amount** → PDF shows a single line = that amount, no tax added.

## I. Recurring jobs (new)
- [ ] **I1.** In 🗓️ Jobs, set a job's **Repeat = Weekly** and **Status = Done**.
- [ ] **I2.** `⚡ CRM ▸ Automations ▸ Roll forward finished recurring jobs` → a **new Scheduled job** appears **7 days later** for the same client; the original's **Rolled? = Yes**.
- [ ] **I3.** Run it again → **no duplicate** is created (idempotent).

## J. Mobile lead-capture form (new)
- [ ] **J1.** `⚡ CRM ▸ Create mobile lead-capture form` → approve any new authorization → an alert shows the **form URL** (also saved in ⚙️ Settings). A "Form Responses" tab appears.
- [ ] **J2.** Open the form URL (on your phone ideally), submit a test lead → it appears in 🎯 **Leads** with status New and a follow-up date.

---

## If something fails
Note the step (e.g. "E2 — PDF didn't generate") and the exact error text from the
Apps Script execution log (`Extensions ▸ Apps Script ▸ Executions`). Send it over and
I'll push a fix. The two most environment-sensitive steps are **E2/E3** (HTML→PDF)
and **A6** (chart) — check those first.

## After it passes
You have a verified master. Fulfillment: `File ▸ Make a copy` per sale → share link
(Anyone with link ▸ Viewer) → drop that link into the delivery PDF.
