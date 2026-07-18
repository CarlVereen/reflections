# 🚀 Launch-readiness checklist

Tick these before you publish. Grouped by priority. Details for each live in the linked docs.

---

## 🔴 Blockers: do NOT launch until these are done

- [ ] **Build the master sheet** in your Google account (`README.md` → build the master).
  Add all four files: `Code.gs`, `Api.gs`, `Sidebar.html`, `WebApp.html`. Run
  **⚡ CRM ▸ Set up / rebuild database**.
- [ ] **Deploy the web app** once as **Execute as Me · Only myself** (`DEPLOY.md`). Confirm
  the app opens.
- [ ] **Run the FULL smoke test** on that live account, every section A–L of `SMOKE-TEST.md`.
  This is the #1 gap: most features have never run live. Specifically verify:
  - [ ] Quote → Approve → Invoice draft **+ Job** created
  - [ ] Send estimate & invoice PDFs (they generate and email)
  - [ ] Recurring job **rolls forward** when marked Done
  - [ ] Review-request, follow-up digest, and appointment-reminder **emails actually send**
  - [ ] Daily automations install (3–4 triggers) and fire
  - [ ] Lead **Form** submission lands in Leads
  - [ ] Calendar event + photo folder create
  - [ ] Rebuild guard warns before erasing
- [ ] **Email deliverability:** send a test invoice/review email to a **non-Google** address;
  confirm it lands in **inbox, not spam**, and looks right.
- [ ] **Security settings verified:** deployed **Only myself**; the master sheet contains
  **no real customer data** before you share it (`SECURITY.md`, `DATA-SECURITY.md`).
- [ ] **Payment + shop accounts:** Etsy shop (ID verified) and/or Gumroad, **payout connected**.
- [ ] **Build the variants** you plan to sell (Cleaning / Lawn Care) and smoke-test each
  (`variants/README.md`).

## 🟠 Should do: meaningfully improves your odds

- [ ] **Listing images:** use `assets/etsy-thumbnail.png` as the **first image (thumbnail)**,
  then `webapp-home.png`, `crm-invoice.png`, `crm-dashboard.png`, `crm-leads.png`, and the
  niche shots. (Add quote-builder / invoice-detail shots once deployed.)
- [ ] **Demo video** (Etsy/Gumroad convert better with one): screen-record the deployed app
  using `VIDEO-SCRIPTS.md`.
- [ ] **First-reviews plan:** launch at **$49** to seed reviews, and line up a few early
  buyers; drop links in the community posts (`LISTINGS.md`).
- [ ] **Delivery files ready:** delivery PDF (copy link filled in) **and** the 6-taps deploy
  card, uploaded to both stores (`PACKAGE.md`).
- [ ] **Decide the DFY logistics** ($149): you can't deploy in a buyer's account; it's
  brand + configure + a **guided** deploy (see the seller note in `LISTINGS.md`).

## 🟡 Awareness: know before the money comes in

- [ ] **Your income is taxable:** track sales; Etsy/Gumroad usually handle *sales* tax,
  not your *income* tax.
- [ ] **Platform dependency:** the product rides on Google Apps Script; a Google change could
  require an update. Low probability, worth knowing.
- [ ] **Setup/deploy is your #1 support driver:** be ready to answer same-day; lean on the
  deploy card + DFY tier.
- [ ] **Refunds:** digital, "no refunds once delivered" stated, but honest listings (the
  "please read before buying" block) are what actually prevent disputes.

---

## ✅ Already done (for your confidence)
Product built (sheet + web app) · bug review (×2) · expert product-fit review · UI/UX review
(contrast/accessibility) · voice-of-customer market review · cybersecurity review + fixes
(formula injection, email escaping, clickjacking) · data/privacy review (verified: **no AI /
no third-party egress**) · full packaging (Etsy + Gumroad copy, delivery PDF, deploy card,
playbook) · privacy assurances surfaced to buyers.

**The gate to launch is the top red block, especially the full live smoke test.** Everything
else is polish or awareness.
