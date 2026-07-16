# The 5-Newsletter Business System

A plan for **5 newsletter businesses that make money without ad revenue**, designed to be
run by AI agents inside the WAT framework (Workflows · Agents · Tools). This file is the
index and the business overview. Everything is grounded in real research — where evidence
is thin or uncertain, it says so. Nothing here is fabricated.

---

## The idea in one paragraph

Pick 5 narrow, information-dense niches where **buyers have money on the line** and the
raw material is **public data an AI can synthesize** (government contracts, FDA
calendars, funding deals, AI-tool news, housing data). An agent pipeline researches,
**fact-verifies**, writes, and sends a weekly issue. Trust built by consistently useful,
accurate issues is converted to revenue through **four non-ad models** — paid
subscriptions, digital products, services/lead-gen, and honest affiliate — matched to
each niche's proven willingness-to-pay.

## The 5 newsletters (research-driven — details & citations in `strategy/niches.md`)

1. **GovCon & Grants Intelligence** — gov-contract/grant opportunity intel · money:
   services/lead-gen + premium tier
2. **Biotech FDA Catalyst Intelligence** — trade-around-FDA-events intel · money:
   subscription
3. **Cybersecurity Deal Intelligence** — cyber funding/M&A/market intel · money:
   lead-gen + paid market maps
4. **Vertical AI for Accounting & Finance** — AI tools for finance pros · money:
   affiliate + digital products
5. **Housing Data Intelligence** — local market data for RE investors · money:
   low-price subscription + affiliate

> **Start with #1 or #2.** Both have the strongest willingness-to-pay evidence and
> cleanest public-data pipelines — the shortest path from zero to a first paying
> customer. Don't launch all five at once (see roadmap).

## How the money is made (no ads) — full plan in `strategy/monetization.md`

| Model | Works at | Ceiling | Used as primary by |
|-------|----------|---------|--------------------|
| Services / lead-gen | small list | very high (thousands/client) | #1, #3 |
| Paid subscription | needs conversion base | recurring MRR | #2, #5 |
| Digital products | tiny list | high margin | secondary, all |
| Affiliate (disclosed) | day one | capped | #4 primary; secondary all |

## Document map

```
NEWSLETTER_SYSTEM.md              ← you are here (overview + index)
strategy/
  niches.md                       ← the 5 niches, evidence, citations, uncertainties
  monetization.md                 ← which money model per newsletter & why
agents/
  00_roster.md                    ← the 12 agents, their roles, tools, handoffs
workflows/
  00_business_lifecycle.md        ← master process flow: every phase & step
  10_issue_production.md          ← per-issue pipeline (research→verify→write→gate→send)
  20_growth.md                    ← audience from zero
  30_monetization_ops.md          ← running the four money models
  40_analytics_improvement.md     ← measure, learn, feed back (WAT loop)
  50_infrastructure_setup.md      ← one-time launch checklist per newsletter
tools/
  README.md                       ← tool catalog, status, required credentials
```

## The agents (summary — full spec in `agents/00_roster.md`)

Managing Editor (orchestrator) → Market Analyst → Editorial Planner → Research →
**Fact-Checker [GATE]** → Writer → Editor → **Quality Gate [GATE]** → Publisher →
Growth + Monetization + Analytics. Two hard gates enforce the no-fabrication rule: an
issue cannot send unless every factual claim is verified against a live source.

## Recommended stack & budget

You chose "flexible / recommend." Here's the honest recommendation. **I will verify each
vendor's *current* price live at setup rather than quoting a number from memory that
might be wrong** (workflow 50, step 1).

- **Phase A — one newsletter, prove the pipeline (lean):** an ESP with a free/low tier +
  landing pages + basic automation; a search API for research; a payment processor
  (often built into the ESP). Rough order of magnitude: **low tens of dollars/month.**
- **Phase B — scaling to 5 + heavier research/writing automation:** paid ESP tiers,
  more API usage, possibly a static host for web archives. Rough order: **low hundreds/
  month**, scaling with list size.

I'm giving ranges, not exact figures, on purpose — real pricing is verified at setup, and
I won't fabricate specifics. The single biggest cost driver is the ESP's per-subscriber
pricing, which only matters once lists grow.

**Already available in this workspace** (could reduce spend): connected MCP servers —
Notion (editorial DB / idea backlog), Google Drive (deliverables), GitHub (this repo as
the system's source of truth). Email *sending to a list still needs a real ESP* — Gmail
is not a bulk sender.

## Roadmap — "Content 5, paid 1-first" (chosen rollout)

The decision (see `strategy/rollout.md` for the reasoning): **run the free/no-spend work
for all 5 newsletters in parallel from the start; stagger only the paid infrastructure,
turning it on for the lead newsletter first and fast-following the rest within days once
the pipeline is proven.** The gap between paid launches is a validation gate, not a queue.

- **Stage 0 — Free work, all 5 in parallel (no spend):** build the no-cost tools
  (`fetch_url`, `fact_source_check`, `link_check`, `rss_ingest`); seed idea backlogs for
  all 5; draft a proof-of-concept issue for the lead niche through the full
  research→verify→write pipeline to prove it end-to-end before any money is spent.
- **Stage 1 — Paid infra for the lead newsletter (#1 or #2):** operator creates ESP +
  payment + domain; run `workflows/50_infrastructure_setup.md`; ship the first real
  issues + lead magnet + archive.
- **Stage 2 — First revenue on the lead:** turn on its fastest money model
  (affiliate/product), then its primary model; measure with `track_metrics`.
- **Stage 3 — Fast-follow the other 4 (days, not months):** once the pipeline is proven,
  flip on paid infrastructure for #2–5, reusing the same known-good agents and tools with
  new niche parameters. Their content/backlogs are already running from Stage 0.
- **Stage 4 — Portfolio management:** weekly review (workflow 40.5); grow winners, pause
  or kill non-performers honestly.

## What I need from you to proceed (I won't fake any of these)

1. **Pick the starting newsletter** — my recommendation is **#1 GovCon** or **#2 Biotech**.
2. **ESP + payment accounts** — these need real signups and credentials only you can
   create. I'll give exact instructions; you authorize and pay.
3. **Confirm the budget tier** so I choose tools to match (or tell me to proceed lean).
4. **Confirm you want me to use the connected MCP tools** (Notion/Drive) as
   infrastructure, or prefer standalone Python tools.

Once you point me at #1, I'll build the first real tools and we run the pipeline for one
issue end-to-end — including the fact-verification gate — before spending on anything.

---

*Guardrails baked into this system:* no fabricated facts (two verification gates), no
ads, disclosed affiliates only, real metrics only, and anything needing money or
credentials is escalated to you — never faked.
