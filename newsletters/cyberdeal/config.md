# Newsletter Config — cyberdeal

> This file is the dial. To re-aim the newsletter (audience, voice, pillars, sources,
> money model, thresholds), edit this file — every downstream station reads from here.

## Identity

- **newsletter_id:** `cyberdeal`
- **display name:** Cybersecurity Deal Intelligence
- **one-line promise:** The weekly read on the *business* of cybersecurity — who's raising,
  buying, going public, and where the budget is flowing — synthesized from public filings,
  press releases, and market data. Not threat news. Deal news.

## Reader avatar

- **Who:** Security-vendor founders and GTM leaders; cyber-focused VCs, growth, and PE
  investors; corp-dev and M&A teams at platform vendors; CISOs and security buyers tracking
  which vendors are funded, consolidating, or at risk.
- **What they need:** Fast, synthesized signal on funding rounds, M&A, IPOs, valuations,
  public-vendor earnings, and budget shifts — so they can position, invest, sell, buy, or
  benchmark. They already get *threat* news (SANS, Hacker News); they lack a readable
  *market/deal economics* digest.
- **Where they gather:** LinkedIn (cyber founder/investor circles), RSAC / Black Hat / cyber
  investor events, Return on Security's audience, SecurityWeek / Crunchbase readers, X/Twitter
  cyber-VC threads, niche Slack/Discord communities for security GTM and CISOs.

## Voice & tone rules

- **Analyst, not hype-man.** Lead with the number and the primary source. Every claim traces
  to a filing, press release, or named report — link it. This audience is sophisticated and
  will scrutinize an AI voice, so the credibility bar is high: cite or cut.
- **Neutral on vendors.** No pumping, no fear-selling. Report deals and imply the "so what,"
  don't cheerlead.
- **Concise and scannable.** Money figures, valuations, multiples, dates up front. Short
  paragraphs, tight bullets, a clear weekly structure.
- **Flag uncertainty honestly.** Distinguish disclosed vs. reported-but-unconfirmed deal
  values ("reportedly ~$250–300M"). Never present a rumor as a fact.
- **No investment advice.** Inform and analyze; never recommend buying/selling a stock or
  company. Educational framing with a standing disclaimer.

## Content pillars (3–5)

1. **Funding radar** — new rounds (seed → growth), valuations, notable investors, and what
   the round signals about a category.
2. **M&A & consolidation** — acquisitions, take-privates, corp-dev moves; who's rolling up
   what and why (identity, cloud, exposure mgmt, OT, AI-security).
3. **Public markets** — cyber IPOs / S-1s, pure-play vendor earnings (ARR, NRR, net-new ARR),
   and public-vs-private valuation gaps.
4. **Budget & category signals** — where security spend is shifting; how exploited-vuln waves
   (CISA KEV) and buyer demand translate into which vendors win budget.
5. **Deal-economics explainers** — valuation multiples, exit benchmarks, PE playbooks in cyber
   — the recurring "how the money works" education layer.

## Public data sources (researcher uses these — all real, verified 2026-07-16)

> Verification note: sources below were confirmed to exist and update via WebSearch. Several
> (sec.gov EFTS, securityweek.com, cisa.gov, news.crunchbase.com) returned HTTP 403 to raw
> WebFetch/curl in the launch environment due to bot protection / egress policy. They are
> public and free; the researcher should hit them via the project's Python tools with a proper
> descriptive `User-Agent` header (SEC requires name+email), not raw WebFetch. See launch note.

- **SEC EDGAR full-text search API** — `https://efts.sec.gov/LATEST/search-index` (UI:
  `https://www.sec.gov/edgar/search/`). Free, no key, requires a User-Agent with name+email,
  10 req/s limit. Use for 8-K item 2.01 (completed acquisitions), S-1 (IPOs), 10-K/10-Q
  (public-vendor earnings/ARR). Coverage from 2001.
- **SecurityWeek — Mergers & Acquisitions** —
  `https://www.securityweek.com/category/mergers-acquisitions/`. Monthly "Cybersecurity M&A
  Roundup" (e.g., 37 deals in June 2026) + funding coverage.
- **Crunchbase News — Cybersecurity** — `https://news.crunchbase.com/sections/cybersecurity/`.
  Quarterly funding trend data and megaround coverage.
- **CISA — Known Exploited Vulnerabilities Catalog & advisories** —
  `https://www.cisa.gov/known-exploited-vulnerabilities-catalog` and
  `https://www.cisa.gov/news-events/cybersecurity-advisories`. Budget/category signal layer.
- **Quarterly cyber funding & M&A reports (press releases)** — Momentum Cyber mid-year/annual
  reviews (via GlobeNewswire), Pinpoint Search Group quarterly cyber vendor funding reports,
  Kroll cyber-sector M&A insights, Solganick cyber-services M&A updates. Public reports.
- **Vendor press releases / investor-relations newsrooms** — e.g.,
  `https://newsroom.accenture.com/`, individual vendor IR pages for round/deal/earnings
  announcements (primary sources).
- **Public IPO/market coverage** — PitchBook and Morningstar cyber-IPO watch articles for
  pipeline (Snyk, Cohesity, etc.).
- **Comparable / competitor context (cite sparingly, not as primary):** Return on Security —
  `https://www.returnonsecurity.com/` — proves the exact weekly funding/M&A format; use to
  sanity-check coverage, not to source claims.

## Money model

> **All monetization stays OFF until the Analyst emits `interest: proven`.** Until then:
> publish, grow, and place only honest, disclosed affiliate links where genuinely useful.

- **Primary (per `strategy/monetization.md` row #3):** Lead-gen + paid vendor "market map" /
  directory placements — connecting funded vendors to buyers, and paid placement in curated
  market maps / category directories. (Subscriptions are historically unstable in this niche;
  sponsor/lead-gen is the proven money path.)
- **Secondary:** Paid community / premium tier (deal database, budget/valuation benchmarks);
  affiliate on security tooling & training.
- **Guardrails:** No display/programmatic ads. No undisclosed sponsorship or pay-to-play
  "recommendations." Any market-map placement is labeled as a placement, ring-fenced from
  editorial and passed through the same fact/quality gates.

## Proven-interest thresholds (defaults from `.claude/agents/nl-analyst.md`)

Treat interest as **proven** when, sustained over ~2–3 issues, ALL hold:

- an engaged base (≥ ~300–500 subscribers), **and**
- healthy engagement (open rate ≥ ~35%, click ≥ ~3%), **and**
- organic growth (net-positive signups without paid push), **and**
- qualitative demand (replies/requests, or archive search traffic rising).

*Starting defaults, not proven-optimal — the Analyst calibrates as real data arrives and
records any change here.* Given this audience is small and high-value, the operator may later
lower the subscriber floor if engagement + qualitative demand from real buyers/investors is
strong; record any such override in this section.

## Free publishing surface

- **Plan:** free ESP tier for sending + a free public web archive for SEO/discovery and
  archive-search signal (which the Analyst reads as qualitative demand).
- **Status:** documented, not provisioned. See launch-readiness note for `[NEEDS OPERATOR]`
  account steps. Nothing here is faked as done.
