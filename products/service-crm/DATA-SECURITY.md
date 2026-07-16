# 🛡️ Data-security review — customer data & privacy

Focus: **where a buyer's customer PII lives, how it flows, and where it could leak** —
with special attention to **AI exposure**.

---

## 0. AI exposure — the short answer: NONE

**This product never sends customer data to any AI, LLM, or outside service.** Verified in
code:
- **No `UrlFetchApp`, no `fetch`, no external endpoints of any kind** — the app literally
  cannot transmit data off the user's Google account.
- **No OpenAI / Anthropic / Gemini / Vertex / any AI API** referenced anywhere.
- The product is **not "AI-powered"** — there is no model call in any feature.

So customer records are **never** fed to an AI for processing, "smart" features, or
training by this app.

**The three parties and what they can see:**
| Party | Access to a buyer's customer data |
|---|---|
| **You (the seller)** | **None.** Each buyer runs their **own** copy in their **own** Google account. You never receive their data. |
| **Anthropic / Claude (the AI that built this)** | **None.** The AI wrote the *code*; it has no connection to any deployed copy and no real customer data was used to build it (templates only). |
| **Google** | It's the host (Sheets/Drive/Gmail/Calendar) — see the "Google's own AI" note below. |

### The one AI nuance worth knowing: Google's own AI (Gemini)
Because the data lives in Google Sheets/Gmail/Drive, the only AI that *could* touch it is
**Google's own** (Gemini / "smart features") — and only per the buyer's Google account
settings, not anything this app does. Guidance for privacy-conscious buyers:
- Consumer Gmail & Workspace: Google states your content isn't used for ads and (for
  Workspace) isn't used to train models outside your organization. Settings still vary.
- To lock it down, a buyer can review **Google Account ▸ Data & privacy** and their
  **Gmail/Workspace "Smart features"** and **Gemini** settings.
This is a Google-platform choice, **not** something this product controls or changes.

---

## 1. What customer PII is stored, and where
| Data | Where it lives |
|---|---|
| Name, phone, email, address | 🎯 Leads, 👥 Clients tabs (the buyer's own Sheet) |
| Job history, service, schedule | 🗓️ Jobs tab |
| Amounts owed/paid, line items | 📄 Estimates, 💵 Invoices, 🧾 Line Items tabs |
| Invoice/estimate **PDFs** | The buyer's Google **Drive** (private) |
| Job **photos** | A Drive folder shared **anyone-with-link** (see risk #1) |
| Lead-form **raw submissions** | A "Form Responses" tab in the same Sheet |
| Job title + client name | The buyer's Google **Calendar** (if they use that feature) |

**All of it lives inside the buyer's own Google account.** Nothing is stored by you or by us.

## 2. Where customer data leaves the account (egress) — and the risks
| Egress | Risk to customer data | Severity |
|---|---|---|
| **Emails to customers** (invoice/estimate/review/reminder) via the owner's Gmail | Wrong/mistyped email in the Clients tab → PII to the wrong person. Sent one-per-recipient (no CC leakage between customers ✅). | 🟡 Medium |
| **Follow-up digest email** (customer names/phones) to the "Owner email" setting | If that setting is mistyped, customer PII goes to a stranger. Defaults to the account owner ✅. | 🟡 Medium |
| **Job photo folder** shared *anyone-with-link* | Anyone with the link can view the photos (property, vehicles, interiors). | 🟠 Notable |
| **Calendar events** carry the client name | If the buyer's Google Calendar is shared/public, client names + schedule leak. | 🟡 Medium |
| **The lead Form** (public link) | Input only (can't read data), but collects PII from submitters; a second copy sits in "Form Responses". | 🟡 Medium |
| **Payment link** (owner's Stripe/PayPal) | Customer pays on that third party — out of this app's scope. | ℹ️ Info |

## 3. Sharing model — the biggest handling risk
- **Fulfillment master:** the seller shares the *master* Sheet "anyone with link ▸ Viewer"
  so buyers can copy it. **The master must contain NO real customer data** — keep it a
  clean template. ✅ (It does.)
- **Buyer's working copy is private by default.** The #1 way a buyer could expose their
  customers is by **manually sharing their working Sheet** (to "collaborate") with
  anyone-with-link, or adding collaborators — everyone then sees all customer records.
  → Buyer guidance below.
- **Google Workspace buyers:** their org **admin** can access the Sheet. Note for
  business/agency buyers.

## 4. Retention & deletion (GDPR / CCPA "right to be forgotten")
The buyer (service business) is the **data controller**; they're responsible for honoring
customer deletion requests. Today that's **manual** — data for one customer can sit in
Clients, Leads, Jobs, Estimates, Invoices, Line Items, Form Responses, saved PDFs, and
Calendar. **To erase a customer**, remove their rows from those tabs and delete their PDFs
and calendar events.

> ⚠️ **Keep financial records as required by law.** Invoices/estimates often must be retained
> for tax purposes — instead of deleting them, you can **anonymize** the customer name on
> paid invoices rather than erase the record. When in doubt, check local requirements.

There is no automated bulk-delete (deliberately — auto-wiping financial records is risky).

## 5. Positive properties (state these with confidence)
- ✅ **No data ever sent to any AI or third party** (verified: no external calls at all).
- ✅ **You (seller) and we (the AI) have zero access** to any buyer's customer data.
- ✅ Data stays **in the buyer's own Google account**; they can export (CSV) or delete it anytime.
- ✅ Emails go **one recipient at a time** — no customer sees another customer's address.
- ✅ Invoice PDFs are **private** in the buyer's Drive by default.

## 6. Buyer guidance (put a short version on the Start Here tab / listing)
- **Don't share your working CRM Sheet** with "anyone with the link." Keep it private; if you
  must add a helper, add them as a named editor and remove them when done.
- **Double-check the email** on a client before sending invoices; verify the **Owner email**
  in Settings is yours.
- **Job photo links are public-with-link** — only store job photos there, and only share the
  link with that customer.
- **To honor a delete request:** remove the customer's rows and PDFs (keep tax-required
  invoices, or anonymize the name).
- Your customer data is **never sent to any AI or outside service** by this app.

---

*This app makes no external network calls and stores everything inside the buyer's own
Google account. The seller and the tool's author have no access to any buyer's customer data.*
