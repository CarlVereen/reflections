# 📦 Packaging & selling Service Pro CRM (Etsy + Gumroad)

Everything you need to list, deliver, and fulfill, all turnkey. Read top to bottom once.

---

## 1. What the product IS (one line)
A complete CRM **app** that runs in the buyer's **own Google account**: leads, quotes,
invoices, jobs, clients, automatic Google-review requests. **One-time price, no subscription,
your data never leaves your Drive.** Works on phone and computer.

## 2. What the buyer receives
- A link to **make their own copy** of the master Google Sheet. All four code files
  (`Code.gs`, `Api.gs`, `Sidebar.html`, `WebApp.html`) and every tab **travel with the copy**;
  they never paste code.
- A 1-page **Start-Here PDF** (the delivery file) with the copy link + setup/deploy steps.
- The full **user manual** (`TRAINING.md`), included with the delivery.
- Their own private **web-app URL** they deploy once (~5 min) and add to their phone.

## 3. One-time seller setup: build the master (~20 min, once)
Do this a single time; every sale is a copy of it.
1. Follow `README.md` → "How to build the master": create the sheet, add the four files,
   run **⚡ CRM ▸ Set up / rebuild database**, approve permissions.
2. **Deploy the web app** yourself once (`DEPLOY.md`) and run through `SMOKE-TEST.md` so you
   know a fresh copy works end-to-end.
3. Fill Settings with neutral placeholder values (buyers overwrite them).
4. `Share ▸ General access ▸ Anyone with the link ▸ Viewer` → **copy that link.**
   → This is the **copy link** you deliver. (Buyers click it → *File ▸ Make a copy*.)

> Make **three masters** if selling all editions: Universal, Cleaning, Lawn Care
> (swap the CONFIG block per `variants/README.md`). Each gets its own copy link.

## 4. Build the delivery file (once per edition)
1. Open `delivery-template.html`, replace **`{{COPY_LINK}}`** (both places) with that
   edition's copy link.
2. Print to PDF (Letter). That PDF is what you upload to Etsy/Gumroad.
   (Sample: `assets/Service-Pro-CRM-Delivery-SAMPLE.pdf`.)
3. Also print **`deploy-card.html`** to PDF and include it, a one-page "Turn on your
   app in 6 taps" quick card that makes the buyer's only technical moment painless.
   (Sample: `assets/Deploy-Card-SAMPLE.pdf`.) Both platforms let you attach multiple files.

## 5. Fulfillment per sale: ~0 effort
Because the copy link is generic and reusable, **you don't customize anything per order.**
- **Etsy:** the buyer auto-receives your uploaded Start-Here PDF (which contains the copy
  link). Nothing to do per sale.
- **Gumroad:** same PDF is the product content. Nothing to do per sale.
- Only the **$149 done-for-you** orders need action (you build + deploy for them).

---

## 6. Pricing (both platforms)
| Item | Price |
|---|---|
| Service Pro CRM (core) | **$69** (launch at $49 to seed reviews, then raise) |
| Cleaning / Lawn Care editions | $69 each |
| **Done-For-You setup + deploy** | **$149** |

The DFY tier matters: deploying the web app is the one technical step, so non-technical
buyers will happily pay you to do it. High margin; it's just you.

## 7. Etsy listing
- **Type:** Digital download. **Delivered file:** the Start-Here PDF (contains the copy link).
- **Title / tags / description:** in `LISTINGS.md` (Etsy section).
- **Images (5–10):** from `assets/`: lead with `webapp-home.png` (the app), then
  `crm-invoice.png`, `crm-dashboard.png`, `crm-leads.png`, and the niche shots.
- **Fees:** ~$0.20/listing + ~6.5% transaction (~$4.70 on $69).
- **Keep the "please read before buying" honesty block** in the description; it's the #1
  refund-preventer (Sheets-based app, email not SMS, one-time Google approval + deploy step).

## 8. Gumroad listing
- Create product → **price** → upload the **Start-Here PDF** as the content (safer than a
  bare redirect; it carries the instructions and the copy link).
- **Cover images:** same `assets/` shots; Gumroad shows a gallery.
- **Fees:** no listing fee; ~10% + card processing. No KYC friction.
- **Traffic:** Gumroad brings *none* on its own; pair it with the ready-to-post community
  blurbs in `LISTINGS.md` (drop the Gumroad link in the comment).
- Optional: turn on ratings; leave "generate license keys" off (not needed).

## 9. Asset inventory (what's in this folder)
| File | Use |
|---|---|
| `Code.gs`, `Api.gs`, `Sidebar.html`, `WebApp.html` | The product (paste into Apps Script) |
| `delivery-template.html` | Buyer Start-Here doc → fill copy link → PDF |
| `deploy-card.html` | "Turn on your app in 6 taps" quick card → PDF (bundle it too) |
| `assets/webapp-home.png` + other PNGs, `*-SAMPLE.pdf` | Listing images + sample delivery |
| `README.md` | Build the master + fulfill |
| `DEPLOY.md` | Deploy the web app (+ multi-account troubleshooting) |
| `SMOKE-TEST.md` | Verify a fresh copy end-to-end |
| `TRAINING.md`, `VIDEO-SCRIPTS.md` | Buyer manual + recordable walkthroughs |
| `LISTINGS.md` | Etsy + Gumroad copy, tags, launch posts |
| `variants/` | Cleaning / Lawn Care editions |
| `ROADMAP.md` | What's built / deferred / out of scope |

## 10. Refund-prevention checklist (do these)
- [ ] Honesty block visible in **every** listing (what it is / is NOT).
- [ ] Offer the **$149 DFY** tier for anyone who doesn't want to deploy.
- [ ] Support line = "reply to your order message" (same-day).
- [ ] Confirm your master passes `SMOKE-TEST.md` before publishing.

## 11. Terms (put a short version in the listing + the delivery PDF)
Digital product: **single-user license**, for the buyer's own business use. **No refunds**
once the file/link is delivered. Not affiliated with Google; requires a free Google account.
