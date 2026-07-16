# Newsletter Config — Housing Data Intelligence

> This file is the **dial**. To re-aim the newsletter, edit this file. Everything
> downstream (planner, researcher, writer, analyst, monetizer) reads from here.

## Identity

- **newsletter_id:** `housing`
- **display_name:** Sunbelt Rental Intelligence
- **one_line_promise:** The public housing data that tells small Sunbelt rental & Airbnb
  operators when to buy, hold, or sell — decoded weekly, one metro at a time.

## The niche-down (how we differ from the big free incumbents)

Redfin, Zillow, and Realtor.com publish excellent *national* housing data for *homebuyers*.
We do NOT compete with that. We serve a specific reader and asset class:

- **Asset class:** 1–4 unit residential held as an **investment** — single-family rentals
  (SFR) and **short-term rentals (STR / Airbnb)**. Not owner-occupant homebuying, not
  large multifamily/apartment syndications.
- **Geography:** the **Sunbelt investor belt** — a fixed watchlist of metros where
  investor share, new supply, and STR regulation fights concentrate:
  **Phoenix, Austin, Dallas–Fort Worth, Tampa, Orlando, Atlanta, Nashville, Charlotte,
  Jacksonville.**
- **The wedge:** the incumbents give you a national median. We translate the same *public*
  data into **an operator's buy/hold/sell decision for one of these nine metros** — layering
  in the things the big dashboards skip: STR regulation, insurance/HOA holding-cost shocks,
  property-tax reassessment, build-to-rent supply, and institutional-landlord flows.

## Reader avatar

- **Who:** an individual or small (1–20 door) residential real-estate investor or
  short-term-rental operator, often with a W-2 job, self-managing or lightly managing.
  Owns or is shopping in one or two of the nine watchlist metros.
- **What they need:** an honest read on whether their metro/submarket is softening or
  firming *before* the crowd; early warning on cost shocks (insurance, taxes, HOA, STR
  rules) that quietly kill cash flow; and confidence that the numbers are real and sourced.
- **What they fear:** buying at the top of a Sunbelt supply glut, an STR ordinance wiping
  out their nightly-rate business, or an insurance/tax reassessment turning a cash-flowing
  door into a bleeder.
- **Where they gather:** BiggerPockets forums & podcast, r/realestateinvesting and
  r/AirBnB, STR Facebook groups, AirDNA / DataRabbit / Parcl webinars, local REIA meetups,
  X/Twitter housing-data accounts (ResiClub, Lance Lambert, Nick Gerli, John Burns).

## Voice & tone rules

- **Analyst, not hype-man.** We report what the data says, including when it says "flat"
  or "we don't know yet." No "10 markets set to EXPLODE" clickbait.
- **Decision-first.** Every issue ends with a plain buy / hold / sell / watch takeaway for
  the metro in focus, with the caveat that it is information, not personalized advice.
- **Show the source.** Every number names its source and date inline. A reader can click
  through and reproduce it. This is the whole credibility proposition.
- **Operator's vocabulary.** Cap rate, cash-on-cash, RevPAR, occupancy, DOM, months of
  supply, gross yield — used correctly, briefly defined on first use per issue.
- **Not investment advice.** Standing disclaimer: educational/informational only; readers
  must do their own due diligence. Never "you should buy X."
- **Concise.** A busy operator skims in 4 minutes. Lead with the chart-in-words and the
  takeaway; details below.

## Content pillars (3–5)

1. **Metro Deep-Dive (rotating).** One watchlist metro per issue: price, rent, inventory,
   months-of-supply, days-on-market trend → buy/hold/sell read. (Redfin, Zillow, Realtor.)
2. **STR Watch.** Short-term-rental economics and regulation: occupancy/RevPAR/supply by
   market, and the ordinance/permit-cap/ban fights that reprice a whole market overnight.
   (AirDNA free reports, city codes departments.)
3. **Cost-Shock Radar.** The holding-cost side of the ledger: mortgage rates, property-tax
   reassessments, insurance, HOA/condo reserve laws — what's eating cash flow this quarter.
   (FRED, Freddie Mac, county appraisal districts, HUD Fair Market Rents.)
4. **Supply & Capital Flows.** Build-to-rent pipelines, permits, and what institutional
   SFR landlords (Invitation Homes, AMH, etc.) are buying or dumping in the Sunbelt.
   (Census Building Permits, RealPage/NAA public reports, REIT filings, Parcl Labs.)
5. **Playbook (occasional).** How to run the numbers: deal-analysis method, cost-seg / STR
   tax mechanics, reading a market like an analyst. Feeds the future digital products.

## Public data sources (verified to exist; the researcher starts here)

> Verification note (2026-07-16): direct WebFetch to several of these hosts was blocked by
> the session's egress proxy (HTTP 403), not by the sources being absent. Each source's
> existence, current URL, and that it publishes the described data were confirmed via live
> web search returning current (2026) figures from each. Re-verify live URLs at first use.

| Source | URL | What we use it for | Access |
|---|---|---|---|
| Redfin Data Center | https://www.redfin.com/news/data-center/ | Metro median sale price, inventory, DOM, months of supply (downloadable) | Free |
| Zillow Research | https://www.zillow.com/research/data/ | ZHVI (home values), ZORI (rents), inventory, new listings by metro | Free |
| Realtor.com Research | https://www.realtor.com/research/data/ | Monthly metro inventory, price, days-on-market; forecasts | Free |
| FRED (St. Louis Fed) | https://fred.stlouisfed.org/series/MORTGAGE30US | 30-yr fixed mortgage rate + housing/economic series | Free |
| Freddie Mac PMMS | https://www.freddiemac.com/pmms | Weekly primary mortgage market survey rates | Free |
| U.S. Census — Building Permits Survey | https://www.census.gov/construction/bps/ | Metro/place residential permits (supply pipeline) | Free |
| U.S. Census — Population/Migration | https://www.census.gov/newsroom/press-releases/ | Domestic migration / population by metro & state | Free |
| HUD USER (PD&R) | https://www.huduser.gov/portal/pdrdatas_landing.html | Fair Market Rents, income limits, housing datasets | Free |
| AirDNA (public reports) | https://www.airdna.co/outlook-report | STR occupancy, RevPAR, supply outlook (free report tier) | Free tier; full data = paid (affiliate candidate) |
| City codes departments | e.g. https://www.nashville.gov/departments/codes/short-term-rentals | STR ordinances, permit caps, enforcement by metro | Free |
| County appraisal districts | per-metro (e.g. Travis CAD, Maricopa County) | Property-tax reassessment data | Free |
| ResiClub Analytics | https://www.resiclubanalytics.com/ | Institutional SFR flows, inventory analysis (corroboration) | Free/freemium |

*All figures the newsletter publishes must be traced to one of these (or an equally public,
named source) with a date. No number without a source — see the Fact-Checker gate.*

## Money model

Assigned in `strategy/monetization.md` (row #5). **All monetization stays OFF until the
Analyst emits `interest: proven`.**

- **Primary:** low-price paid subscription **$7–30/mo** — premium metro data digests,
  the full nine-metro buy/hold/sell scorecard, and cost-shock alerts.
- **Secondary:** **affiliate** on genuinely useful, disclosed data/operator tools
  (AirDNA, PropStream, DataRabbit, lender/insurance marketplaces) + **digital products**
  (deal-analysis & STR underwriting spreadsheets, per-metro market reports).
- **Guardrails:** non-ad by design; every affiliate link is an honest, disclosed
  recommendation vetted through the Quality Gate — never pay-to-play. No fabricated
  subscriber/revenue claims. Not investment advice.

## Proven-interest thresholds

Copied from `.claude/agents/nl-analyst.md` defaults (operator may override here). Interest
is **proven** only when, sustained over ~2–3 issues, ALL hold:

- **Engaged base:** ≥ ~300–500 subscribers, **and**
- **Engagement:** open rate ≥ ~35% **and** click rate ≥ ~3%, **and**
- **Organic growth:** net-positive signups without paid push, **and**
- **Qualitative demand:** replies/requests (e.g. "cover Tampa next") or rising archive
  search traffic.

*Defaults, not proven-optimal — the Analyst recalibrates as real data arrives and records
any change here.*

## Free publishing surface (documented, not faked)

- **Plan:** free ESP tier (send + hosted signup/landing page) + free web archive of issues.
- Concrete stack recommendation and current pricing get verified live at setup by the
  Publisher per `workflows/50_infrastructure_setup.md` (Step 1). Candidate free tiers to
  evaluate: beehiiv / MailerLite / Buttondown free plans (all offer a free send tier +
  hosted page at low list sizes — confirm current limits at setup).
- Everything requiring an operator account, domain, DNS, or payment is a **[NEEDS
  OPERATOR]** blocker below — configured by agents, authorized/paid by the operator.
