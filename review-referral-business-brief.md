# Project Handoff Prompt — Review → Referral Lead-Gen Business

> **How to use this:** Paste this whole file into your VS Code Claude (or keep it in the repo as context). It contains (1) the locked-in decisions ("MEMORY"), (2) the research and reasoning behind them, and (3) exactly where to pick up. Everything below the "MEMORY" block is settled unless I say otherwise.

---

## ROLE / CONTEXT FOR THE ASSISTANT

You are helping me (Carl) build and launch a **productized service business**: a done-for-you **review-getting + referral-getting system** for high-ticket home-service contractors, built on **GoHighLevel (GHL)**. The strategy, pricing, cost model, and target niche are already decided (see MEMORY). Your job is to help me **execute** — build the GHL system, write the sequences, define the offer, and go to market. Do not re-litigate the strategy unless I ask; pick up from "WHERE TO PICK UP."

---

## MEMORY — LOCKED-IN DECISIONS (start here)

1. **The business model:** A done-for-you service that installs a two-part system for contractors:
   - **Part 1 — Review engine:** automatically request Google reviews after each completed job (SMS + email), filter/route unhappy customers privately before they post publicly.
   - **Part 2 — Referral engine:** on top of reviews, ask happy (4–5 star) customers for referrals at the moment of peak satisfaction. This is the differentiator — most competitors stop at reviews and never close the loop into referrals.

2. **The platform:** **GoHighLevel** (white-label, resell under my own brand). Confirmed my GHL plan is **$500/mo for unlimited client sub-accounts.**

3. **The target niche:** **High-ticket specialty / outdoor-living home services where referrals are already king.** Umbrella = outdoor living / hardscaping. Specific sub-niches, in priority order:
   - **Lead with the under-called ones** (less agency competition, less price pressure): **retaining walls, driveways/paving, and "crazy stuff" — water features, putting greens, custom outdoor lighting, saunas, pergolas.**
   - **Umbrella / expansion:** outdoor kitchens, patios, pool builders (bigger tickets but more agency attention).
   - One GHL build serves all of them — same buyer, same job flow, same integrations.

4. **Why this niche (the wedge):** These buyers spend $10k–$100k and "aren't searching for the cheapest option — they're searching for **proof** you can deliver the dream in their head." Reviews + before/after photos + referrals *are* that proof. Most of these contractors already run on word of mouth but **have no system** for it. Every job also produces a visual before/after (review bait + referral ammo) and a literal billboard in a neighbor's yard.

5. **Pricing (validated, believable):**
   - **Setup fee:** $500–$2,000 one-time (build system, integrate field software, write sequences). Start ~$1,000.
   - **Monthly retainer:** $300–$1,000/mo. **Start at ~$500/mo.**
   - **Believability test the price must pass:** the fee must be *less than the value of one extra customer per month.* On a $30k patio job, $500/mo is trivial to justify — "if this gets you one extra job a month, it pays for itself and everything after is profit."
   - **Do NOT** price under $200/mo (reads as a cheap tool) or jump to $3k–$20k/mo yet (that requires tying the fee to *tracked revenue* — a later, outcome-based move).

6. **Cost stack (my costs to run it):**
   - GHL platform: **$500/mo flat**, unlimited clients.
   - Per client, one-time: A2P brand registration **$4** (sole prop) / **$48+** (standard) + campaign registration **~$15** → bake into setup fee. Approval takes 1–4 weeks (register clients early).
   - Per client, monthly: A2P campaign fee **$1.50–$10** + phone number **~$2** + SMS usage **~$0.013–0.018/text** + email **~free to $1/1,000** → **~$15–30/mo total** for a low-volume review/referral system.
   - **Economics:** 10 clients × $500 = $5,000/mo revenue; costs ~$750/mo (platform + usage) → **~$4,250 gross margin.** Use GHL **rebilling** to pass usage costs to clients.

7. **The proven analog to study:** **Josh Nelson (Seven Figure Agency / Plumbing & HVAC SEO)** — runs exactly this model (niche home-services agency on GHL, teaches others to do it). **Tommy Mello (A1 Garage / "Home Service Expert")** = the buyer archetype (obsessive about reviews; note he ranks SEO #1, so position reviews/referrals as one pillar of a bigger engine). **NiceJob** = a tool that already automates the review→referral loop (~$75/mo) — study how they've structured it, but it's not white-label so it's not my competitor for done-for-you.

---

## RESEARCH FOUNDATION (why the above is sound)

**The strategy is expert-backed:**
- **Fred Reichheld (Bain, inventor of Net Promoter Score):** promoters (9–10s / 5-star reviewers) are the primary engine of organic growth via referrals. His "earned growth" concept = literally this business.
- **Jay Baer (Talk Triggers):** 50% of purchases are influenced by word of mouth; 60–80% of business comes from referral for many companies. **Caveat:** a happy customer ≠ an automatic referrer — you need something *remarkable* worth talking about.
- **Joey Coleman (Never Lose a Customer Again):** advocacy is the final earned stage of the customer journey, not a shortcut.
- **Daniel Kahneman (peak-end rule):** ask for the referral at the emotional peak (right after a positive review/job completion). But don't ask *before value is felt* — review requests fired within 24h of a transaction can underperform vs. 9–14 days out.
- **Nielsen:** 92% trust recommendations from friends/family (highest of all); 70%+ trust online reviews (2nd). Converting a public reviewer into a private referrer is a *trust upgrade*, not just more volume.

**The pain is real and quantified in home services:**
- **Jobber 2026 Home Service Trends Report** (350k+ pros): **referrals = 59% of lead volume** — the single biggest source — yet contractors have no system to scale it, and it collapses in slow seasons.
- **BrightLocal 2025:** 91% read reviews; most won't consider a business under 4 stars; 85% use Google. Only 29% wrote a review last year but 96% are willing → an **"asking problem," not a willingness problem.**
- Unprompted reviews ≈ 10% response; asking on the job ≈ 4×. CPL rose 10.5% YoY for 69% of advertisers; PE-backed consolidators squeezing independents → cheap, high-trust channels (reviews/referrals) matter more.
- An entire "reputation management for contractors" sub-industry already exists (ServiceTitan, Podium, Birdeye, NiceJob, etc.) = validated demand. Their gap: they stop at reviews, rarely close the referral loop.

**Niche selection principle:** "**Density without saturation**" — 50k+ businesses nationally, high value, referral-native, but most owners don't run modern marketing and agencies haven't flooded in. Dentists/med spas fail this (over-called). GHL officially pushes the crowded list (home services, med spas, real estate, legal) — so going one notch into under-called high-ticket outdoor services is the right counter-move. Outdoor kitchen market is **+200% since 2020**.

---

## THE SYSTEM TO BUILD (in GoHighLevel)

Target flow — trigger off the contractor's field software (Jobber / ServiceTitan / "job marked complete"):

1. **Job completed** → wait an appropriate delay (not instant — let value land; test same-day vs. 2–3 days).
2. **Review request** (SMS + email) with a direct Google review link.
3. **Sentiment gate:** route 4–5 star intent to the public Google review; route 1–3 star privately to the owner (recover before it goes public).
4. **Photo capture:** prompt for / collect before-and-after photos (doubles as review bait + referral ammo + social content).
5. **Referral ask** at the satisfaction peak: pre-written, one-tap-forwardable message + reciprocity offer (discount / gift / entry). Only to happy customers.
6. **Attribution:** unique referral links/codes so I can prove "these N jobs came from the loop" — this proof is the entire upsell to outcome-based/higher pricing later.
7. **Reporting dashboard** for the client (reviews generated, star trend, referrals, attributed jobs).

Use GHL's **reputation management** module + **workflows** + **rebilling**. Consider grabbing a GHL "medical/wellness" or "home services" **snapshot** and repointing it at the outdoor-living niche to build faster.

---

## WHERE TO PICK UP (next actions — help me with these)

1. **Build the offer:** name it, and package tiers (e.g., Reviews-only vs. Reviews+Referrals vs. full package w/ attribution) with what's included at each and the $ per tier.
2. **Build the GHL system:** the workflow above — sequences, timing, sentiment gate, referral messages, dashboard. Draft the actual SMS/email copy.
3. **Pick the beachhead sub-niche + geography:** which under-called outdoor niche to hit first (retaining walls / driveways / custom features) and where.
4. **Go-to-market:** how I find and pitch the first 5 contractors; the sales conversation (lead with "you run on referrals but have no system + your buyers are hunting for proof").
5. **Open questions to resolve:** exact review-request delay to test; whether to require field-software integration or start manual; reciprocity offer structure for referrals; how to present attribution.

**Start by asking me which of the 5 next actions to tackle first, then go deep on that one.**

---

## NOTES / CAUTIONS

- Reviews→referrals as *tasks* is a commodity (~$500–2k/mo ceiling). The path to premium pricing ($3k+) is repositioning around **tracked revenue added**, not activity. Build attribution from day one so I can make that leap later.
- Don't oversell referrals as a standalone silver bullet — per Tommy Mello, the best operators treat reviews/referrals as one pillar feeding local SEO/visibility. Frame the offer accordingly.
- Only ask 4–5 star customers for referrals; never surface a lukewarm customer.
