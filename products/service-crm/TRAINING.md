# ⚡ Service Pro CRM — User Manual

Welcome! This guide gets you from zero to running your whole service business
from one Google Sheet. No apps to install, no monthly fees, and your data never
leaves your Google account.

**Total setup time: about 5 minutes.**

---

## 1. What this is (in one sentence)

A Google Sheet with a smart "⚡ CRM" menu that tracks your **leads, jobs,
clients, and invoices**, and automatically emails **follow-up reminders**,
**appointment reminders**, and **Google-review requests** for you.

## 2. The seven tabs

| Tab | Use it to… |
|-----|-----------|
| 🚀 **Start Here** | Your one-time setup checklist. |
| 📊 **Dashboard** | See the numbers — new leads, pipeline, revenue, win rate, a revenue chart, and who to follow up with. Updates by itself. |
| 🎯 **Leads** | Track every potential customer through New → Contacted → Quoted → Won/Lost. |
| 🗓️ **Jobs** | Schedule and track work — booked, in progress, done, paid. |
| 👥 **Clients** | Your customer address book. "Total Spent" adds itself up. |
| 📄 **Estimates** | Log quotes; generate a branded PDF estimate in one click. |
| 💵 **Invoices** | Log invoices; generate a PDF (with tax + Pay-now) and email it in one click. |
| 🧾 **Line Items** | Optional: itemize an estimate/invoice (Description / Qty / Rate). |
| ⚙️ **Settings** | Business info, currency, sales tax %, review link, payment note & link — plus **"Your services"** (edit that list to control the Service dropdown in the panel and the Leads/Jobs tabs). |

## 3. First-time setup (do this once)

1. **Open ⚙️ Settings** and fill in every row:
   - Business name, owner email, business phone
   - **Google review link** — see section 8 for how to find yours
   - **Invoice payment instructions** — e.g. "Zelle to you@email.com"
2. **Reload the sheet.** You'll see a **⚡ CRM** menu appear at the top.
3. Click **⚡ CRM ▸ Set up / rebuild CRM** (only needed once, or after big changes).
4. Click **⚡ CRM ▸ Open Quick Actions panel** — this is your daily command center.

### ⚠️ Approving the app — read this first (it looks scarier than it is)

The first time you run a menu item, Google shows a warning. **This is 100% normal and
expected** for any tool that runs inside your own Google account — it's not a virus and
nothing is wrong. Here's the exact path to click:

1. **"Authorization required"** → click **Continue**.
2. **Choose your Google account** (the one that owns this sheet).
3. **"Google hasn't verified this app"** — don't stop here. Click the small **Advanced**
   link (bottom-left).
4. Click **"Go to Service Pro CRM (unsafe)."** The word *unsafe* is just Google's generic
   label for any personal script — this is **your own copy**, running only in **your**
   account. Your data never leaves your Google Drive.
5. Review the permissions and click **Allow**.

**Why it needs permission:** to send your emails (follow-ups, invoices, review requests),
save invoice PDFs and photo folders to your Drive, add jobs to your Calendar, and build
your lead form. It only ever acts inside your own account.

You may see this prompt **once more later** the first time you use a feature that needs a
new permission (like creating the lead Form or adding a calendar event) — same quick steps.

> **On a work/school (Google Workspace) account** and don't see the **Advanced** link? Your
> company admin blocks unverified scripts. Just use a **personal @gmail.com account**
> instead — everything works the same, with no restrictions.

## 4. Your daily routine (2 minutes)

Open the **⚡ Quick Actions panel** and you can:
- **Add a lead** the moment someone calls — name, phone, service, value. A
  follow-up date is set automatically.
- See **Follow-ups due** — exactly who to call back today.
- **Email review requests** and **your follow-up list** with one tap.

That's it. Everything feeds the Dashboard automatically.

## 5. Working leads

- Add leads from the panel or type straight into the 🎯 **Leads** tab.
- Change the **Status** dropdown as things progress. Colors update automatically.
- **Next Follow-up** turns **red** when it's overdue so nothing slips.
- Won the job? Click the lead's row, then **⚡ CRM ▸ Add & convert ▸ Schedule a
  job from selected lead** (creates the job) or **Convert selected lead → client**.

## 6. Jobs & getting paid

- Log work in the 🗓️ **Jobs** tab: date, client, service, price.
- Mark **Status = Done** and **Paid? = Yes** when complete.
- The client's **Total Spent** (in 👥 Clients) updates automatically.
- **Recurring work?** Set the **Repeat** column to Weekly / Biweekly / Monthly. When you
  mark that job **Done**, the CRM automatically creates the next visit for you (once daily
  automations are on, or via **⚡ CRM ▸ Automations ▸ Roll forward finished recurring jobs**).
- **See it on your phone's calendar:** click a job row → **⚡ CRM ▸ Jobs ▸ Add selected job
  to Google Calendar**. (Put a time like `2pm` in Scheduled Time for a timed event.)
- **Before/after photos:** click a job row → **⚡ CRM ▸ Jobs ▸ Create photo folder for
  selected job**. A shareable Drive folder is linked in the **Photos** column — upload
  shots from your phone and send the client the link as proof of work.

## 7. Estimates & invoices in one click

Both work the same way and produce a branded PDF, emailed to the client and saved to Drive.

1. **Estimate:** add a row in 📄 **Estimates** (estimate #, client, dates). Click it →
   **⚡ CRM ▸ Invoices & estimates ▸ Create & email estimate**.
2. **Invoice:** add a row in 💵 **Invoices** (invoice #, client, dates). Click it →
   **Create & email invoice**. It's marked **Sent** and can flag **Overdue** later.
3. **Itemize (optional):** in 🧾 **Line Items**, add rows with the **same number** as the
   estimate/invoice — Description / Qty / Rate. The PDF then lists each line, adds your
   **Sales tax %** (from ⚙️ Settings), and totals it. No line items? Just type a single
   **Amount** on the row instead.
4. **Get paid online:** put your Stripe/PayPal/Venmo link in ⚙️ **Settings ▸ Payment link**
   and invoices show a **Pay now** button.

## 8. Getting more 5-star reviews (the money-maker)

More Google reviews = more jobs. The CRM automates the ask:
1. Find your review link: Google "**Google review link generator**", or in your
   Google Business Profile: **Ask for reviews ▸ Share review form** and copy the link.
2. Paste it into ⚙️ **Settings ▸ Google review link**.
3. After a job is **Done + Paid**, click **⚡ CRM ▸ Automations ▸ Send review
   requests**. Every eligible client gets a friendly, branded email with your link.
   (Each client is only asked once.)

## 9. Turn on autopilot

**⚡ CRM ▸ Automations ▸ Turn ON daily automations.** From then on, every morning:
- 🔁 **Recurring jobs** roll forward to their next visit.
- 🚩 **Overdue invoices** get flagged.
- 🔔 You get your **follow-up list** by email (8am) — with a **tap-to-text** link per lead.
- 📅 **Appointment reminders** go to clients scheduled for the next day.

**Capture leads from your phone:** run **⚡ CRM ▸ Create mobile lead-capture form** once.
You'll get a Google Form link — bookmark it on your phone. Anything submitted drops
straight into your 🎯 Leads tab. (The menu and side panel are computer-only, so this
Form is the mobile-friendly way to add a lead from a driveway.)

Turn it off anytime with **Turn OFF daily automations**.

## 10. Tips & limits

- **Desktop vs phone (important):** the ⚡ CRM menu and Quick Actions panel work on a
  **computer** (Google Sheets in a browser), *not* in the phone app. Do your setup,
  data entry, and invoicing on a laptop. On your phone you can still **view and edit
  the sheet** in the Google Sheets app — and the daily automations (follow-up emails,
  appointment reminders, review requests, overdue flags) **run on their own**, no menu needed.
- **Emails, not texts:** reminders and review requests are sent by **email**. Apps Script
  can't send SMS on its own.
- **Email limit:** a normal Gmail account can send ~100 automated emails/day
  (plenty for a small business). Google Workspace accounts get ~1,500.
- **Back up anytime:** File ▸ Make a copy.
- **Re-brand it:** change the `BRAND` colors at the top of the script and re-run setup.

## 11. Help

Stuck? Reply to your purchase receipt and we'll help you get running.
