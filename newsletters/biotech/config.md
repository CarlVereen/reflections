# Newsletter Config — Biotech FDA Catalyst Intelligence

> This file is the dial. Re-aim the newsletter by editing this file — every downstream
> station (planner, researcher, writer, fact-checker, analyst, monetizer) reads it.

## Identity

- **newsletter_id:** `biotech`
- **Display name:** Biotech FDA Catalyst Intelligence
- **One-line promise:** Plain-English intelligence on the FDA decisions, trial readouts,
  and advisory-committee votes that move biotech stocks — so you see the catalyst before
  the crowd does.
- **Cadence (starting):** weekly issue + a rolling "catalyst calendar" section.
  (Planner may add event-triggered special editions around major PDUFA dates.)

## Reader avatar

- **Who:** Retail and semi-professional biotech investors and traders who position around
  binary FDA events. Range from self-directed brokerage users to small RIA/analyst types
  and biotech-curious generalist investors.
- **What they need:** (1) A trustworthy, *date-accurate* forward calendar of PDUFA dates,
  AdCom meetings, and Phase 2/3 readouts; (2) context on what each event means, the
  base-rate odds, and the setup (what's priced in, what the bull/bear cases are);
  (3) fast, sober post-event analysis (approval, CRL, AdCom vote, data beat/miss) without
  hype. They are time-poor and burned by hype accounts.
- **Where they gather:** r/biotechplays and r/wallstreetbets, StockTwits/X biotech cashtags,
  Seeking Alpha, Substack biotech writers (e.g., Dan Sfera's 10k+ free list), Discord
  trading rooms, BioPharma Dive / STAT / Endpoints / Fierce Biotech readerships.

## Voice & tone rules

- **Analyst, not tipster.** Explain the event, the mechanism, the odds, and both sides.
  Never "buy/sell/hold." Frame everything as information and education.
- **Lead with the date and the fact.** Every catalyst gets: ticker, drug, indication,
  event type, date, and the primary public source link. Facts before commentary.
- **Sober and precise.** No hype, no rocket emojis, no "guaranteed" anything. Quantify
  uncertainty ("historical AdCom-to-approval base rate," "date is a target, extensions
  happen"). Short sentences; define jargon on first use (PDUFA, CRL, AdCom, sNDA, BLA).
- **Show your sources.** Link the FDA notice, the 8-K, the trial registry entry, the press
  release. If a date is company-guided vs. FDA-confirmed, say which.
- **Cite provenance of dates.** Mark each date as `FDA-confirmed`, `company-guided`, or
  `estimated` — never present an estimate as official.

### Brand / compliance rules (HARD — Fact-Checker gate enforces)

- **NOT INVESTMENT ADVICE. Educational and informational only.** Every issue must carry a
  visible disclaimer: this newsletter does not provide investment, financial, legal, or
  tax advice; nothing here is a recommendation to buy, sell, or hold any security; readers
  must do their own research and/or consult a licensed professional; the authors may be
  wrong and dates/outcomes change.
- **No recommendations, price targets, or "positions."** Never state or imply that the
  newsletter holds a position or that a reader should trade.
- **No non-public / no material-nonpublic information.** Only synthesize public sources.
  No leaks, no rumors presented as fact, no "sources tell us."
- **Date accuracy is the reputation line.** Every date must trace to a checkable public
  source and be labeled with its provenance (see above). A wrong date is a killing error
  here — the Fact-Checker must verify every date against the cited primary source before
  publish.
- **Affiliate/product disclosure:** any affiliate link or paid product is disclosed inline
  and must be a genuine, vetted recommendation (never pay-to-play). Off until proven.

## Content pillars (3–5)

1. **The Catalyst Calendar** — forward-looking PDUFA dates, AdCom meetings, and major
   Phase 2/3 readouts, with ticker, drug, indication, date, and provenance.
2. **Pre-event setups** — what a given upcoming catalyst is, the science in plain English,
   base-rate odds, and the bull/bear framing (what the market seems to expect).
3. **Post-event teardowns** — sober analysis after an approval, CRL, AdCom vote, or data
   readout: what happened, why, and what it changes.
4. **FDA & regulatory mechanics** — evergreen explainers (what a CRL means, how AdComs
   vote, accelerated approval, priority review, PDUFA extensions, new pathways such as the
   2026 bespoke gene-editing pathway) that make readers smarter event-by-event.
5. **Sector signal** — clustering of catalysts by therapeutic area (oncology, IgAN/renal,
   gene/cell therapy, metabolic/obesity) so readers see the season's themes.

## Public data sources (researcher pipeline — all real, all public)

> Verified as canonical public sources on 2026-07-16. NOTE: several government/API hosts
> below were **blocked by the session's egress proxy (HTTP 403 policy denial)** during
> setup — they are real and correct, but the automated researcher will need them
> allowlisted (see Launch Readiness → NEEDS OPERATOR). Existence was confirmed via search
> results referencing live URLs on these domains.

**Primary / regulatory (authoritative):**
- FDA Advisory Committee Calendar — https://www.fda.gov/advisory-committees/advisory-committee-calendar
  (AdCom meeting dates, drugs, committees; individual meeting announcement pages)
- Drugs@FDA (approvals & action letters) — https://www.accessdata.fda.gov/scripts/cder/daf/
- openFDA API (drug/approval data, machine-readable) — https://api.fda.gov
- Federal Register — FDA agency (official AdCom meeting notices) —
  https://www.federalregister.gov/agencies/food-and-drug-administration
- ClinicalTrials.gov + API v2 (trial status, phases, primary completion dates) —
  https://clinicaltrials.gov  ·  https://clinicaltrials.gov/api/v2/studies
- SEC EDGAR — 8-K / 10-Q / press-release exhibits (company-confirmed PDUFA dates, trial
  results, CRLs) — https://www.sec.gov/cgi-bin/browse-edgar  ·
  full-text search API https://efts.sec.gov/LATEST/search-index?q=
  (SEC requires a declared User-Agent header on automated requests)
- Company IR / newsroom press releases and 8-K exhibits (per-ticker)

**Secondary / cross-check (calendars & trade press — never sole source for a date):**
- BiopharmaWatch FDA/PDUFA calendar — https://www.biopharmawatch.com/fda-calendar
- MarketBeat FDA calendar — https://www.marketbeat.com/fda-calendar/upcoming/
- RTTNews FDA calendar — https://www.rttnews.com/corpinfo/fdacalendar.aspx
- Dan Sfera biotech catalyst calendar — https://dansfera.com/
- BioPharma Dive — https://www.biopharmadive.com  ·  STAT — https://www.statnews.com  ·
  BioSpace — https://www.biospace.com  ·  Fierce Biotech — https://www.fiercebiotech.com
- BioPharmaCatalyst — https://www.biopharmacatalyst.com/calendars/fda-calendar
  (bot-protected; use as lead, confirm on primary source)

**Sourcing rule:** every PDUFA/AdCom/readout **date** must be confirmed against a PRIMARY
source (FDA, Federal Register, SEC filing, or company IR release). Calendars above are for
discovery/cross-check only — never the citation of record for a date.

## Money model

- **Primary:** Paid subscription, $20–100/mo (catalyst calendar, pre-event setups,
  post-readout teardowns). Direct comp: RTT Biotech Investor $99/mo. Highest
  revenue-per-subscriber vertical (investing ~$230/sub [directional]).
- **Secondary:** Digital products (catalyst-tracking templates/spreadsheets); affiliate on
  brokerage/charting tools — genuine, disclosed recommendations only.
- **STATUS: OFF until interest is proven.** No paywall, no products, no affiliate links
  ship until the proven-interest thresholds below are met and the Analyst emits
  `interest: proven`. Sequencing per `strategy/monetization.md`: grow free → lead magnet →
  first digital product → turn on subscription.

## Proven-interest thresholds (unlocks monetization)

Copied from `.claude/agents/nl-analyst.md` defaults. Treat interest as **proven** only
when, sustained over ~2–3 issues, ALL of the following hold:
- **Engaged base:** ≥ ~300–500 subscribers, **and**
- **Healthy engagement:** open rate ≥ ~35% and click rate ≥ ~3%, **and**
- **Organic growth:** net-positive signups without paid push, **and**
- **Qualitative demand:** replies/requests, or rising archive/search traffic.

*These are starting defaults, not proven-optimal. The Analyst calibrates as real data
arrives and records any override here. **Per-newsletter override:** none set — using
defaults.*

## Free publishing surface

- **ESP:** free-tier email service provider (e.g., beehiiv free / MailerLite free /
  Substack free) — **[NEEDS OPERATOR]** to create the account and connect the API.
- **Web archive:** free public archive/landing page (ESP-hosted archive or a free static
  site) so issues are indexable and searchable — **[NEEDS OPERATOR]**.
- No paid tooling assumed. Anything requiring an account, domain, or payment is flagged in
  the Launch Readiness note, not pretended to be done.
