# Workflow 50 — Infrastructure Setup (one-time, per newsletter)

**Objective:** Stand up everything a newsletter needs to capture signups, send email,
and take payment — before the first issue. Owner: Publisher + Monetization agents.

**Important:** Several steps require the operator to create real accounts and provide
real credentials. These CANNOT be fabricated or auto-provisioned by the agents. Each
such step is marked **[NEEDS OPERATOR]** and must be handed to the operator with exact
instructions. The agents configure and verify; the operator authorizes and pays.

---

## Step 1 — Choose the stack  · *Market Analyst + Monetization*

Recommend a concrete stack sized to budget (see `NEWSLETTER_SYSTEM.md` → "Recommended
stack & budget"). Decisions to lock:
- Email Service Provider (ESP) — must support: automation, a signup/landing page,
  paid subscriptions or an easy payment integration, and referral mechanics.
- Payment processor (may be built into the ESP or separate).
- Domain / subdomain per newsletter.

**Do not assert specific current prices from memory.** Verify each product's current
pricing and feature set with `tools/fetch_url.py` on the vendor's live pricing page at
setup time, and present that to the operator.

---

## Step 2 — Domain & sending identity  · **[NEEDS OPERATOR]**

1. Operator registers/points a domain or subdomain for the newsletter.
2. Configure sender authentication: SPF, DKIM, DMARC. `tools/esp_admin.py --dns-records`
   outputs the exact records; operator adds them at their DNS host.
3. Verify authentication passes before any send (protects deliverability from day one).

---

## Step 3 — ESP account & list  · **[NEEDS OPERATOR]** to create, agent to configure

1. Operator creates the ESP account and provides API access to the agents (stored in
   `.env`, never elsewhere — per CLAUDE.md).
2. Agent creates the list/audience, tags, and a welcome automation.
3. Agent configures the double opt-in and the welcome email that delivers the lead magnet.

---

## Step 4 — Signup / landing page  · *Publisher*

1. `tools/render_page.py --newsletter <id>` builds the landing page: promise, proof,
   lead-magnet offer, signup form wired to the ESP.
2. Publish it (ESP-hosted page or the web archive host).
3. Verify a live test signup flows end-to-end: submit → double opt-in → welcome → lead
   magnet delivered.

---

## Step 5 — Payment & offers  · **[NEEDS OPERATOR]** for account, agent to configure

1. Operator connects the payment processor (KYC/bank details are the operator's — agents
   never handle these).
2. Agent creates the initial offer objects (subscription tier and/or first product):
   `tools/create_checkout.py`.
3. Verify a live test purchase in test mode before going live.

---

## Step 6 — Analytics wiring  · *Analytics*

1. Confirm `tools/track_metrics.py` can read the ESP + payment stats via API.
2. Establish the metrics log location for this newsletter.

---

## Setup completion checklist (gate to Phase 1)

- [ ] Domain authenticated (SPF/DKIM/DMARC pass)
- [ ] ESP list live with welcome automation
- [ ] Landing page live; test signup succeeded end-to-end
- [ ] Lead magnet delivered on signup
- [ ] Payment processor connected; test purchase succeeded
- [ ] Metrics tool reads ESP + payment data
- [ ] Idea backlog seeded (≥8 topics)

Only when every box is checked does the newsletter enter the weekly production cadence.
