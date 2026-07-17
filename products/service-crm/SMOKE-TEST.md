# ✅ Smoke test — Service Pro CRM

Run this once on a real Google account after building your master. ~15 minutes. It exercises
every feature that can only be verified live. **The app is the primary interface; a few
automations run from the sheet's ⚡ CRM menu.** Check each box; if one fails, note the step
and the error and send it over.

> Tip: use your **own email** as the test client so the emails come back to you.

---

## A. Build the master (sheet + code)
- [ ] **A1.** New Google Sheet → `Extensions ▸ Apps Script`. Add **four files**: `Code.gs` (paste over the stub), `Api.gs` (new **script** file), `Sidebar` (new **HTML** file), `WebApp` (new **HTML** file). **Save.**
- [ ] **A2.** Reload the sheet → a **⚡ CRM** menu appears → `⚡ CRM ▸ Set up / rebuild CRM` → approve the Google auth (Advanced → Go to project → Allow).
- [ ] **A3.** Confirm **9 tabs** in order: 🚀 Start Here, 📊 Dashboard, 🎯 Leads, 🗓️ Jobs, 👥 Clients, 📄 Estimates, 💵 Invoices, 🧾 Line Items, ⚙️ Settings — **no leftover "Sheet1."** The 📊 Dashboard shows KPI tiles and a **revenue chart** (present, not a blank box).

## B. Deploy the app (see `DEPLOY.md`)
- [ ] **B1.** `Deploy ▸ New deployment ▸ (gear) Web app` → **Execute as: Me**, **Who has access: Only myself** → **Deploy** → **Authorize**. Copy the **Web app URL** (ends in `/exec`).
- [ ] **B2.** Open the URL → the **app loads on the Home screen** (KPI tiles, "Follow-ups due", "This week's jobs"). *(If you get a Drive "unable to open the file" error, you have multiple Google accounts — open it in an Incognito window signed into just the owner account. `⚡ CRM ▸ 📲 Open the app (get link)` shows the URL anytime.)*

## C. Settings & services (in the app)
- [ ] **C1.** App → **More ▸ Settings** → fill **Business name**, **Owner email** (your address), phone, **Currency**, **Sales tax %** (e.g. 8.25), **Google review link** (any URL), payment instructions, and a **Payment link** (any URL). Set **Invoice due (days to pay)** (e.g. `7`, or `0` for "Due upon receipt"). Under **Document numbering**, optionally set a custom **Next quote/estimate #** (e.g. `Q-2001`) and **Next invoice #** (e.g. `INV-5001`) → **Save settings**.
- [ ] **C2.** Edit the **"Your services"** box (one per line) → **Save services**. The new service now appears in the app's Service dropdowns.

## D. Contacts (leads + clients, in the app)
- [ ] **D1.** **Contacts ▸ +** (or Home ▸ **+ Contact**) → add a contact with **name, phone, email (= your own), address, and Service** → **Add contact**. It appears in the **Contacts** list (tagged **New**) **and** in the 🎯 Leads sheet tab (Address in the new col K) with a **Next Follow-up** date.
- [ ] **D2.** Tap the contact → **Call / Text** links show, address + service show, **New / Quoted / Declined / Lost** status buttons work, follow-up reschedule works, and **Create estimate** opens the builder pre-filled. After they have a quote/invoice/upcoming job, the detail shows an **Active** section (tap a quote/invoice → opens it in Billing).
- [ ] **D3.** **Add a second contact re-using the same email or phone** → a **⚠️ Possible duplicate** prompt lists the match; **Cancel** stops it, **Add anyway** still adds it (warn, not block).
- [ ] **D4.** Toggle the **Name / Last job** sort. A contact who has a logged job shows their **last job date** (green) instead of a status; sorting by **Last job** puts the most-recently-served first.

## E. Quote → Approve → Invoice → Paid — the core flow (in the app)
- [ ] **E1.** **Billing ▸ + New estimate** → client = your test client (email = you) → add **2 line items** (Service + Qty + Price) → watch the **running Total** update (with tax) → **Create & send**.
- [ ] **E2.** The estimate appears under **Billing ▸ Quotes** **and** in the 📄 Estimates tab; you receive an **ESTIMATE PDF** — itemized, with **subtotal + tax + total** and "Valid until". *(If you set a custom start in C1, confirm the estimate # matches it — e.g. `Q-2001` — and the invoice created at E3 uses your invoice start.)*
- [ ] **E3.** Open that estimate → **Approve → create invoice**. Confirm: estimate → **Accepted** (it moves to the collapsed **Closed quotes** group); a 💵 **Invoice draft** appears under **Outstanding invoices** with the **line items copied**; **and** a 🗓️ **Job (Scheduled)** was created.
- [ ] **E4.** **Billing ▸ Outstanding invoices** → open the draft → (optionally **Edit line items**) → **Send invoice** → you receive an **INVOICE PDF** (itemized, tax, a **Pay now** button) and status flips to **Sent**. Confirm the **Due** = send date **+ your terms** (e.g. 7 days), or reads **"Due upon receipt"** if you set `0` in C1.
- [ ] **E5.** **Mark paid** → status **Paid**; the invoice drops out of **Outstanding** into the collapsed **Paid** group (tap it to expand). Go to **Home** → **Revenue** and **Lifetime** update.
- [ ] **E6.** Re-open that invoice and **Send** again → the **total is unchanged** (tax is not applied twice). ✅
- [ ] **E7.** Open any estimate → **Mark accepted** moves it to **Closed quotes** (keeps the record); or **Delete quote** removes it (with a confirm). Open an invoice → **Delete invoice** works the same. Use these to clear stuck/duplicate docs from old testing.
- [ ] **E8.** Note your **Home ▸ Lifetime** figure. **Settings ▸ 📦 Archive old paid & closed docs** → confirm the toast counts; **Billing** now shows fewer Paid/Closed rows, and new `📦 Archived…` tabs hold them. Re-check **Home ▸ Lifetime** — it's **unchanged** (archived paid revenue is carried forward). Run archive again → it reports **nothing** to archive (idempotent).

## F. Jobs & Contacts (in the app)
- [ ] **F1.** **Jobs ▸ + New job** → add a job for the client (date, price) → appears in the app **Jobs** list and the 🗓️ Jobs tab.
- [ ] **F2.** Tap a job → **Reschedule** to a new date (it moves in the list), set **Status = Done** and **Mark paid**. From **Home**, tapping a "this week's jobs" row opens that **same job detail**.
- [ ] **F3.** **Contacts** → your test client now shows a green **last job date** tag; open them → **Last job … · N jobs · Total spent** = the sum of their paid jobs.

## G. Automations & emails (from the sheet's ⚡ CRM menu)
These run server-side / on triggers — not in the app.
- [ ] **G1.** `⚡ CRM ▸ Automations ▸ Send review requests` → you (as the test client) get the **⭐ review-request email**; the job's **Review Sent? = Yes**. Run again → **nothing sent** (no duplicate).
- [ ] **G2.** Make sure a lead's follow-up is **due today**, then `⚡ CRM ▸ Automations ▸ Email me today's follow-ups` → you get the **🔔 digest** (with a tap-to-text link). *(Also a one-click in the desktop Quick Actions panel.)*
- [ ] **G3.** Add a job dated **tomorrow** for your client → `⚡ CRM ▸ Automations ▸ Send tomorrow's appointment reminders` → you get the **📅 reminder**; **Reminder Sent? = Yes**.
- [ ] **G4.** Set an invoice's **Due Date = yesterday**, Status = **Sent** → `⚡ CRM ▸ Invoices & estimates ▸ Flag overdue invoices` → it flips to **Overdue**.
- [ ] **G5.** `⚡ CRM ▸ Automations ▸ Turn ON daily automations` → confirmation. `Apps Script ▸ Triggers` shows **4 time-based triggers**. Then **Turn OFF** → all removed.

## H. Recurring jobs
- [ ] **H1.** In 🗓️ Jobs, set a job **Repeat = Weekly** and **Status = Done**.
- [ ] **H2.** `⚡ CRM ▸ Automations ▸ Roll forward finished recurring jobs` → a **new Scheduled job appears 7 days later** for the same client; the original's **Rolled? = Yes**.
- [ ] **H3.** Run it again → **no duplicate** (idempotent).

## I. Google Calendar + photos (sheet menu)
- [ ] **I1.** In 🗓️ Jobs, put a time like `2pm` on a job → click the row → `⚡ CRM ▸ Jobs ▸ Add selected job to Google Calendar` → authorize → an event appears on your Google Calendar. (No time → all-day event.)
- [ ] **I2.** Click a job row → `⚡ CRM ▸ Jobs ▸ Create photo folder` → authorize → a shareable folder link appears in the **Photos** column.

## J. Mobile lead-capture Form
- [ ] **J1.** `⚡ CRM ▸ Create mobile lead-capture form` → authorize → an alert shows the **form URL** (saved in ⚙️ Settings); a **"Form Responses"** tab appears.
- [ ] **J2.** Submit a test lead via that form (on your phone) → it appears in 🎯 **Leads** (New + follow-up date) **and** in the app's **Leads** list. *(Security: try submitting a name like `=1+1` — it should stay literal text, not become a formula.)*

## K. Safety guard
- [ ] **K1.** With data now in the sheet, run `⚡ CRM ▸ Set up / rebuild CRM` again → a **warning** asks before erasing → click **No** → nothing is wiped.

## L. On your phone
- [ ] **L1.** Open the app URL on your phone → **Add to Home Screen** → run the **lead → quote → approve → invoice → paid** flow again. Everything works and syncs back to the sheet.

---

## If something fails
Note the step (e.g. "E4 — invoice PDF didn't generate") and the exact error from
`Extensions ▸ Apps Script ▸ Executions`. The most environment-sensitive steps to check first:
**B2** (deploy / multi-account), **E2 & E4** (HTML→PDF invoices/estimates), and **A3** (chart).

## After it passes
You have a verified master. Per sale: `File ▸ Make a copy` → share the master link
(Anyone with link ▸ Viewer) → that link goes in the delivery PDF. **Each buyer deploys their
own copy** (their own app URL) — the deploy step is theirs, done once.

---

## M. Local-first speed + optimistic writes (2026-07-17 build)
1. Open **More ▸ Business Settings**, scroll to the bottom: the **⏱** readout should show a low
   **boot** time and **0 api calls** right after opening. Navigate Home→Clients→Jobs→Billing, open a
   client, open an invoice, open the price book — the api-call count should **stay at 0** (all reads are
   local). It only ticks up when you *write*.
2. **The race:** add a new client, then IMMEDIATELY (before the "✓ Saved" badge) create an estimate for
   that client, then Approve → invoice + job, then Mark paid. Every step should register instantly and
   NONE should say "pick a valid client." Reload — all records are really there with real IDs.
3. **Reverse sync:** hand-edit a client's name in the Google Sheet, then reload the app → the edit
   appears (the stale flag rebuilt the JSON). Same after a lead comes in via the mobile form.
4. Tap ⟳ any time → one `apiRefresh` call, data refreshes from Sheets.

## N. Client-assigned numbers + instant actions (build g)
1. New client → shows a real `CL-` id immediately; open it and Edit works right away (no dead button).
2. New estimate → real `EST-` number immediately; Approve it right away → real `INV-` number, no
   "estimate not found" / "pick a valid client". Numbers never change while a screen is open.
3. From **Home**, mark a week-job Done → it leaves the Home list immediately (no ~30s wait).
4. Archive a just-created client/job → removes instantly, never "finishing save, try again."
