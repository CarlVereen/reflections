# Workflow 30 — Monetization Operations (non-ad)

**Objective:** Turn each newsletter's trust and attention into revenue **without ad
revenue**. Four models, layered as the list matures. Owner: Monetization agent.

**Sequencing principle:** offers follow trust. Don't sell hard to a 50-person list.
The typical order as a list grows: affiliate/product first (works at small scale) →
paid tier (needs enough free readers to convert a few %) → services/lead-gen (needs
proof and authority).

---

## Model A — Paid subscription / premium tier

**What it is:** the free newsletter is the funnel; a paid tier adds depth (deeper
analysis, full archives, data cuts, tools, community).

Steps:
1. Define the free/paid split: what stays free, what justifies paying.
2. Price it (validate current market pricing during Phase 0.3 — do not assume a number).
3. Set up recurring billing: `tools/create_checkout.py --type subscription`.
4. Gate premium content in the ESP.
5. Convert via: a premium section teased in every free issue + periodic upgrade sequences.

**Best fit:** niches with ongoing, decision-driving information (see `strategy/niches.md`).

---

## Model B — Digital products & courses

**What it is:** one-time or evergreen assets sold to the list — templates, databases,
playbooks, mini-courses, reports.

Steps:
1. Mine reader questions & top-performing issues for a product people already want.
2. Build the product (produced through workflow 10 so it's fact-verified).
3. Host + sell: `tools/create_checkout.py --type product`.
4. Launch sequence to the list; then evergreen it (link in relevant archive issues).

**Best fit:** any niche; highest margin; good first-dollar path at small list sizes.

---

## Model C — Services / lead-gen / paid community

**What it is:** the newsletter proves expertise; high-intent readers convert into
consulting, done-for-you work, a paid community, or are routed as qualified leads to
partners for a fee.

Steps:
1. Add a low-friction "work with us / talk to us" path for high-intent readers.
2. Qualify inbound via a short form (`tools/render_page.py`).
3. For lead-gen: partner with real service providers who pay per qualified lead
   (contract + disclosure required).

**Best fit:** B2B / professional niches where a single client is worth a lot.

---

## Model D — Affiliate / partnerships

**What it is:** commissions for recommending genuinely useful tools/products the reader
would benefit from. *(You flagged this is ad-adjacent — it is included because you
accepted it, but every placement must be a genuine recommendation, never pay-to-play.)*

Steps:
1. Only recommend things vetted by the same fact/quality gates as editorial.
2. **Disclose every affiliate link** (enforced by workflow 10, step 6.3).
3. Track with `tools/create_checkout.py --type affiliate` (link wrapping + attribution).

**Best fit:** niches built around tools, software, gear, or services.

---

## Cross-model rules

- **Trust first.** A monetization CTA never overrides editorial honesty. If a product
  isn't good, it isn't recommended, regardless of commission.
- **Disclosure always.** Affiliates and sponsored-adjacent content are labeled.
- **One primary ask per issue.** Don't stack five CTAs; pick the one that fits.
- **Track per-offer revenue** (Phase 4.1) and cut offers that don't convert.

## Which models per newsletter

Each of the 5 niches is assigned a **primary** and **secondary** model in
`strategy/monetization.md`, chosen from real willingness-to-pay evidence gathered in
Phase 0.1 — not assumed.
