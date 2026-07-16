# Newsletter Config — govcon

> This file is the dial. To re-aim this newsletter, edit this file. Every downstream
> station (planner, researcher, writer, analyst, monetizer) reads from here.

## Identity

- **newsletter_id:** `govcon`
- **Display name:** GovCon & Grants Intelligence
- **One-line promise:** The weekly synthesis of public federal-opportunity data — SAM.gov,
  Grants.gov, SBIR, USAspending — turned into "what changed, who won, and what to bid on
  next," without the $29k platform price tag.

## Reader avatar

- **Who:** Business-development / capture leads at small and mid-sized government
  contractors; SBIR/STTR-seeking startup founders and their grant writers; grant-seeking
  nonprofits and university researchers who need early signal on federal opportunities.
- **What they need:** Early, filtered signal on relevant opportunities (by NAICS / agency /
  set-aside / geography); deadline awareness; competitive intelligence ("who won last
  time," incumbent expirations); plain-English reads on rule and vehicle changes that move
  their pipeline. They are time-poor and cannot afford GovWin IQ (~$29k/yr) or Instrumentl
  (~$299/mo).
- **Where they gather:** LinkedIn (GovCon groups, #govcon), APMP and NCMA communities,
  GovConWire / SmallGovCon / Federal News Network readerships, SBIR/STTR agency listservs,
  local PTAC / APEX Accelerator events, Reddit r/govcon.

## Voice & tone rules

- **Analyst, not hype-man.** Neutral, precise, evidence-first. Every claim traces to a
  public source with a date. Numbers are the hero.
- **Actionable over comprehensive.** Each item ends with a "so what / do this" for a BD or
  capture reader. We curate; we do not dump feeds.
- **Plain English on jargon.** Define FAR/DFARS/CMMC/NAICS terms on first use in an issue.
- **No fabrication, ever.** If a solicitation number, deadline, or award value isn't
  verified against the primary source, it does not run. Dates and dollar figures are gated
  by the fact-checker — errors here are reputation-killing.
- **Disclosed and honest.** No pay-to-play. Any affiliate or service mention is a genuine,
  disclosed recommendation.
- **Not legal or bid advice.** We inform decisions; we frame rule/protest coverage as
  information, not counsel.

## Content pillars (3–5)

1. **Opportunity radar** — new and upcoming solicitations, NOFOs, SBIR/STTR topics, and
   contract-vehicle on-ramps worth bidding, filtered by relevance and deadline. (Sources:
   SAM.gov, Grants.gov, SBIR.gov, agency portals.)
2. **Who won / award intelligence** — award and obligation analysis: who's winning in a
   NAICS/agency, incumbent contract expirations, teaming targets. (Sources: USAspending,
   SAM.gov contract awards / FPDS, SBIR awards.)
3. **Rules & compliance watch** — FAR overhaul, CMMC, SBA size-standard and 8(a)/WOSB/
   SDVOSB/HUBZone program changes, translated into pipeline impact.
4. **Money flows & market trends** — where federal dollars are moving (AI, cyber, IT
   modernization, defense), fiscal-year-end dynamics, budget/shutdown signals.
5. **Grants desk** — federal grant opportunities and process changes (Simpler.Grants.gov
   migration, agency cycles) for nonprofit/research readers.

## Public data sources (verified real — the researcher's primary feeds)

All are free and public. Some require a free API key (flagged). Verified 2026-07-16.

| Source | What it feeds | Access | Notes |
|---|---|---|---|
| SAM.gov Get Opportunities Public API | Pillar 1 (open solicitations, notices) | Free **API key required** (request in SAM.gov Account Details) — **[NEEDS OPERATOR]** | Base: `https://api.sam.gov/prod/opportunities/v2/search`. Docs: open.gsa.gov/api/get-opportunities-public-api/ |
| SAM.gov contract award data / FPDS | Pillar 2 (who won) | Free (sam.gov/fpds) | Award notices + FPDS contract data |
| Grants.gov Search2 REST API | Pillars 1 & 5 (grant NOFOs) | Free, **no key required** | `https://api.grants.gov/v1/api/search2` (POST JSON). Docs: grants.gov/api/api-guide |
| Simpler.Grants.gov + its API | Pillar 5 (grants, modern search) | Free | Now default search UI; API-first. simpler.grants.gov/developers |
| SBIR.gov APIs (Solicitations, Awards, Company) | Pillars 1 & 2 (SBIR/STTR topics + awardees) | Free | sbir.gov/api ; awards + solicitations in JSON/XML/XLS |
| USAspending.gov API v2 | Pillars 2 & 4 (obligations, spending trends) | Free, **no key required** | Base: `https://api.usaspending.gov/api/v2/`. Docs: api.usaspending.gov |
| GAO Recent Bid Protest Decisions | Pillar 3 (protest signal) | Free (public web) | gao.gov/legal/bid-protests/recent |
| SBA federal-contracting rules & articles | Pillar 3 (size standards, 8(a), CMMC) | Free (public web) | sba.gov/federal-contracting |

> Access note: the SAM.gov Opportunities API is the only primary feed needing a free
> operator-obtained key. Grants.gov, USAspending, SBIR, and GAO are open. Until the SAM key
> exists, opportunity-radar items for contracts can be sourced from the SAM.gov web UI and
> agency portals, but the API is strongly preferred for reliable automation.

## Money model

Assigned from `strategy/monetization.md` (row #1). **All monetization stays OFF until the
Analyst emits `interest: proven`.**

- **Primary — Services / lead-gen:** proposal & capture help, teaming introductions,
  compliance guidance. One client can dwarf subscription revenue (incumbent intel platforms
  run ~$29k/yr). Turned on only after proven interest.
- **Secondary — Premium tier ($15–40/mo):** curated opportunities by NAICS/agency/geo,
  deadline tracking, "who won last time." **Plus affiliate** on registration / compliance /
  proposal SaaS — genuine, disclosed recommendations only, never pay-to-play.
- **Sequencing:** publish + grow first; ship a lead magnet; place only honest disclosed
  affiliate links where genuinely useful; build a digital product from best issues once
  there are a few hundred engaged readers; turn on the primary services/lead-gen funnel
  only once the free list converts predictably.

## Proven-interest thresholds

Copied from `.claude/agents/nl-analyst.md` defaults (adjustable here as real data arrives).
Treat interest as **proven** when, sustained over ~2–3 issues, ALL hold:

- an engaged base (≥ ~300–500 subscribers), **and**
- healthy engagement (open rate ≥ ~35%, click ≥ ~3%), **and**
- organic growth (net-positive signups without paid push), **and**
- qualitative demand (replies/requests, or archive search traffic rising).

*Starting defaults, not proven-optimal — calibrate and record any change here.*

## Cadence

- Weekly issue (target). Opportunity-radar and grants-desk items are deadline-sensitive, so
  a consistent weekly slot beats sporadic long pieces.
