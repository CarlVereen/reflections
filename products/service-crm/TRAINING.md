# ⚡ Service Pro CRM User Manual

Welcome! Service Pro CRM is a real **app** for your service business (leads, clients,
jobs, estimates, invoices, and automatic reminders) that runs entirely in **your own
Google account**. No monthly fees, and your data never leaves your Drive.

**Total setup time: about 10 minutes, once.**

---

## 1. How it works (the one thing to understand)

You do your daily work in the **app** (a link you open on your phone or computer). Behind
the app is a **Google Sheet** that acts as the database; you rarely need to open it. The
**⚡ CRM menu** inside that sheet is only for **one-time setup** and turning on the daily
automations.

- **App = daily use** (add clients, schedule jobs, send invoices).
- **Sheet + ⚡ CRM menu = setup + automations** (done on a computer, mostly once).

## 2. First-time setup (do this once, on a computer)

1. Open the copy link from your Start-Here PDF → **File ▸ Make a copy**. The whole CRM (all
   the code) is now yours, private, in your Google Drive. Nothing to paste.
2. Reload the sheet. A **⚡ CRM** menu appears at the top. Click
   **⚡ CRM ▸ Set up / rebuild database** and approve the permissions (see the box below).
3. **Set your timezone** so scheduled jobs hit your calendar at the right hour:
   **Extensions ▸ Apps Script ▸ Project Settings (⚙️) ▸ Time zone** → choose yours.
4. **Turn on your app:** **Extensions ▸ Apps Script ▸ Deploy ▸ New deployment ▸ (gear ⚙️)
   Web app** → **Execute as: Me**, **Who has access: Only myself** → **Deploy** → **Authorize**.
   Copy the **Web app URL** it gives you. (Full detail + troubleshooting in `DEPLOY.md`.)
5. Open that URL. That's your app. On your phone: browser menu → **Add to Home Screen**.
6. In the app, open **More ▸ Business Settings** and fill in your business name, phone,
   email, sales tax %, Google review link, and payment link.
7. Back in the sheet, **⚡ CRM ▸ Automations ▸ Turn ON daily autopilot**.

### ⚠️ Approving the app: read this first (it looks scarier than it is)

The first time you run setup, Google shows a warning. **This is 100% normal** for any tool
that runs inside your own Google account. The exact path:

1. **"Authorization required"** → **Continue**.
2. **Choose your Google account** (the one that owns this sheet).
3. **"Google hasn't verified this app"** → click the small **Advanced** link (bottom-left).
4. Click **"Go to Service Pro CRM (unsafe)."** *Unsafe* is just Google's generic label for a
   personal script; it's **your own copy**, running only in **your** account.
5. Review the permissions and click **Allow**.

**Why it needs permission:** to add jobs to your **Google Calendar**, send your **emails**
(follow-ups, invoices, reminders, review requests), save **invoice PDFs** and your **logo**
to Drive, and build your **lead form**. It only ever acts inside your own account. You may
see the prompt **once more** the first time a new feature is used (e.g. Calendar). Same steps.

> **On a work/school (Google Workspace) account** and don't see **Advanced**? Your admin
> blocks unverified scripts. Just use a **personal @gmail.com account** instead.

## 3. Getting around the app

Five tabs across the bottom:

| Tab | What it's for |
|-----|---------------|
| 🏠 **Home** | Your dashboard: new leads, open pipeline, jobs this week, revenue, win rate, lifetime, plus **Follow-ups due** and **This week's jobs**. Quick **+ Lead** / **+ Estimate** buttons. |
| 👥 **Clients** | Your address book. Every client is a Lead / Active / Inactive / Lost. Tap one to **Call**, **Text**, get **🧭 Directions**, set a follow-up, or start an estimate/job. |
| 🗓️ **Jobs** | Scheduled work: **Today / Upcoming / Completed**. Add jobs, set a time, reschedule, mark Done. |
| 💵 **Billing** | **Quotes** (estimates), **Outstanding** (unpaid invoices), **Paid**, and **Closed**. |
| ⋯ **More** | Your **Price book** (default service prices) and **Business Settings**. |

## 4. Daily routine (about 2 minutes)

- **New lead calls?** Home → **+ Lead** (or Clients → add). Add name, phone, address, and a
  follow-up date is set automatically.
- **Home ▸ Follow-ups due** shows exactly who to call back today. Tap a client to **Call** or
  **Text** right from the app.
- Move clients from **Lead → Active** as you win the work.

## 5. Clients & directions

- Tap a client to see their card: phone (**Call** / **Text**), **address as a link**, plus a
  **🧭 Directions** button that opens Google Maps directions to their place.
- Their card also shows any **upcoming job**, **open estimate**, or **unpaid invoice**, and
  totals up their **lifetime spend** automatically.

## 6. Scheduling jobs (with Google Calendar sync)

- **Jobs ▸ + New job** (or from a client card ▸ **New job**): pick the client + service, set
  the **date** and a **time** (e.g. `2pm`), and an optional **Repeat** (Weekly / Monthly /
  Quarterly / Annual).
- If **Google Calendar sync** is on (it is by default; **More ▸ Business Settings ▸
  Scheduling**), each scheduled job **automatically appears on your Google Calendar**, with
  the **client's address as the event location** (tap it for directions). Reschedule or cancel
  a job and the calendar event **updates or disappears** to match.
- Tap a job to **Reschedule** (new date + time), change **Status** (Scheduled / Done /
  Cancelled), or **Archive** it.
- **Recurring work:** set **Repeat**, then mark the job **Done**, and the CRM creates the next
  visit for you (once daily autopilot is on, or via **⚡ CRM ▸ Automations ▸ Roll forward
  finished recurring jobs**).

> ⏰ **Timezone matters:** calendar event times use your Apps Script timezone (set in step 3).
> If a `2pm` job shows at the wrong hour, fix **Project Settings ▸ Time zone**.

## 7. Estimates → invoices → paid (all in the app)

1. **Create an estimate:** from a client card ▸ **Create estimate**, or **Billing** → new
   quote. Add line items (each pulls its default price from your **Price book**; you can
   override the price on any line). Tax comes from your **Sales tax %**.
2. **Send it:** the estimate goes out as a **branded PDF** emailed to the client.
3. **Approve → invoice + job:** when the client says yes, open the estimate and tap
   **Approve → invoice + job**. It asks for a **job date and time**, creates a **draft
   invoice** (with the quoted lines), and **schedules the job** (which syncs to your calendar).
4. **Get paid:** send the invoice (branded PDF), then **Mark paid** when the money's in. The
   client's **lifetime spend** updates automatically. Put your Stripe/PayPal/Venmo link in
   **Settings ▸ Payment link** to show a **Pay now** button on invoices.

## 8. Business Settings (More ▸ Business Settings)

- **Business profile**: name, owner email, phone, address (used on PDFs + emails).
- **Money**: currency, sales tax %, invoice payment instructions, payment link, invoice due days.
- **Numbering**: your next estimate # and invoice #.
- **Follow-up & reviews**: default follow-up days, and your **Google review link**.
- **Scheduling**: **Google Calendar sync** (On/Off) and **default job length (hours)**.
- **Appearance**: accent color; and upload your **company logo** for PDFs.

## 9. Getting more 5-star reviews (the money-maker)

1. Find your review link: Google "**Google review link generator**", or in your Google
   Business Profile: **Ask for reviews ▸ Share review form**.
2. Paste it into **Settings ▸ Google review link**.
3. After a job is **Done**, run **⚡ CRM ▸ Automations ▸ Send review requests** (in the sheet).
   Every eligible client with an email gets a friendly, branded ask, **each client only once**.

## 10. Turn on autopilot (in the sheet)

**⚡ CRM ▸ Automations ▸ Turn ON daily autopilot.** Every morning after that:
- 🔁 **Recurring jobs** roll forward to their next visit.
- 🚩 **Overdue invoices** get flagged.
- 🔔 You get your **follow-up list** emailed (with a tap-to-text link per client).
- 📅 **Appointment reminders** email clients scheduled for the next day.

Turn it off anytime with **Turn OFF daily autopilot**.

**Capture leads from your phone:** run **⚡ CRM ▸ Create mobile lead-capture form** once →
you get a Google Form link (bookmark it / put it on flyers). Every submission drops straight
into your **Clients** list as a new Lead.

## 11. Tips & limits

- **The ⚡ CRM menu is computer-only** (it lives in Google Sheets in a browser). Do setup and
  automations there. **Everything else is in the app**, which works great on your phone.
- **Emails, not texts:** reminders and review requests are sent by **email**. Apps Script
  can't send SMS. (You can still tap **Text** on a client to text from your own phone.)
- **Email limit:** a normal Gmail account sends ~100 automated emails/day; Google Workspace ~1,500.
- **Back up anytime:** File ▸ Make a copy.
- **Timezone:** if calendar times look off, set **Apps Script ▸ Project Settings ▸ Time zone**.

## 12. Help

Stuck? Reply to your purchase receipt and we'll help you get running, usually same day.
