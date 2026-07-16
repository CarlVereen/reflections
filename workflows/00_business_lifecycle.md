# Workflow 00 — Newsletter Business Lifecycle (Master Process Flow)

**Objective:** Define every step required to take a single newsletter from "does not
exist" to "profitable and self-sustaining," and name the agent responsible for each
step. Each of the 5 newsletter businesses runs this identical lifecycle; only the
niche parameters change (see `strategy/niches.md`).

**Core rule (non-negotiable):** No fabricated facts. Every external claim that ships
to a reader must trace to a real, live source captured by a tool. The
`06 → verify` and `09 → quality_gate` steps exist to enforce this. If a claim cannot
be verified, it is cut — never invented.

This file is the map. Each phase points to a detailed workflow file that owns the
step-by-step SOP.

---

## The five phases

```
PHASE 0  Launch (one-time per newsletter)      → workflows/50_infrastructure_setup.md
PHASE 1  Issue Production (recurring, weekly)   → workflows/10_issue_production.md
PHASE 2  Growth (recurring, continuous)         → workflows/20_growth.md
PHASE 3  Monetization (recurring, continuous)   → workflows/30_monetization_ops.md
PHASE 4  Analytics & Improvement (recurring)    → workflows/40_analytics_improvement.md
```

The **Managing Editor agent** (`agents/00_roster.md`) orchestrates all phases for a
given newsletter and hands off to specialist agents step by step.

---

## PHASE 0 — Launch (one-time per newsletter)

| # | Step | Owner agent | Tool(s) | Output |
|---|------|-------------|---------|--------|
| 0.1 | Validate niche: confirm buyers, willingness-to-pay, competitors, freshness | Market Analyst | `web_search`, `fetch_url`, `rss_ingest` | Niche validation memo (go / no-go) |
| 0.2 | Define positioning: reader avatar, promise, voice, content pillars | Market Analyst + Editorial Planner | — | Positioning brief |
| 0.3 | Design the money: pick offers (tier, product, service, affiliate) per niche | Monetization | — | Offer stack (see workflow 30) |
| 0.4 | Stand up infrastructure: ESP account, domain/subdomain, signup page, payment | Publisher + Monetization | `esp_admin`, `render_page` | Live signup URL + send-ready ESP |
| 0.5 | Build the lead magnet (first free asset that earns the signup) | Growth + Writer | research→write pipeline | Lead magnet asset |
| 0.6 | Seed the idea backlog (20+ candidate issue topics) | Editorial Planner | `rss_ingest`, `web_search`, `store_idea` | Populated backlog |

**Gate to Phase 1:** signup page is live, ESP can send, backlog has ≥8 topics.

---

## PHASE 1 — Issue Production (recurring)

Full SOP in `workflows/10_issue_production.md`. Summary of every step:

| # | Step | Owner agent | Tool(s) |
|---|------|-------------|---------|
| 1.1 | Pick the issue's topic & angle from backlog | Editorial Planner | `read_backlog` |
| 1.2 | Gather sources & raw material | Research | `web_search`, `fetch_url`, `rss_ingest` |
| 1.3 | **Verify every factual claim against live sources** | Fact-Checker | `fact_source_check` |
| 1.4 | Draft the issue in the newsletter's voice | Writer | — |
| 1.5 | Edit for structure, clarity, voice | Editor | — |
| 1.6 | **Quality & compliance gate** (sourcing, links, disclosures, deliverability) | Quality Gate | `link_check`, `spam_score` |
| 1.7 | Render to email HTML + schedule/send | Publisher | `render_email`, `send_newsletter` |
| 1.8 | Cross-post to web archive (for SEO/discovery) + social | Publisher + Growth | `publish_web_archive`, `social_post` |
| 1.9 | Log the issue & update backlog | Editorial Planner | `store_idea` |

**Gate to send (1.7):** Fact-Checker AND Quality Gate must both return PASS. A single
unverifiable claim blocks the send until cut or sourced.

---

## PHASE 2 — Growth (continuous)

Full SOP in `workflows/20_growth.md`.

| # | Step | Owner agent | Tool(s) |
|---|------|-------------|---------|
| 2.1 | Publish issues to a public web archive (evergreen SEO surface) | Growth | `publish_web_archive` |
| 2.2 | Distribute to communities & social where the reader avatar lives | Growth | `social_post` |
| 2.3 | Run a referral loop (readers invite readers) | Growth | `esp_admin` |
| 2.4 | Offer lead magnets on every surface | Growth | `render_page` |
| 2.5 | Protect deliverability: list hygiene, re-engagement, sunset inactives | Growth | `esp_admin` |

---

## PHASE 3 — Monetization (continuous)

Full SOP in `workflows/30_monetization_ops.md`. Non-ad only. Four models per newsletter:
paid subscription tier, digital products/courses, services/lead-gen, affiliate/partner.

| # | Step | Owner agent | Tool(s) |
|---|------|-------------|---------|
| 3.1 | Build & price the offer (tier / product / service / affiliate set) | Monetization | `create_checkout` |
| 3.2 | Weave soft calls-to-action into free issues | Monetization + Writer | — |
| 3.3 | Run dedicated sales sequences to the list | Monetization | `send_newsletter` |
| 3.4 | Place genuinely-useful, disclosed affiliate recommendations | Monetization | `create_checkout` |
| 3.5 | Route high-intent readers to a service/lead-gen funnel | Monetization | `render_page` |
| 3.6 | Track conversions & revenue per offer | Analytics | `track_metrics` |

---

## PHASE 4 — Analytics & Improvement (recurring)

Full SOP in `workflows/40_analytics_improvement.md`. This is the WAT self-improvement
loop applied to the business.

| # | Step | Owner agent | Tool(s) |
|---|------|-------------|---------|
| 4.1 | Pull metrics: open/click/growth/unsub/revenue per issue & offer | Analytics | `track_metrics` |
| 4.2 | Diagnose: what worked, what didn't, why | Analytics | — |
| 4.3 | Design one experiment (subject line, offer, cadence, format) | Analytics | — |
| 4.4 | Update the relevant workflow file with what was learned | Managing Editor | — |
| 4.5 | Weekly portfolio review across all 5 newsletters | Managing Editor | `track_metrics` |

---

## Cadence (steady state, per newsletter)

- **Weekly:** 1 issue via Phase 1; growth tasks (Phase 2) run continuously.
- **Per issue:** monetization CTA (Phase 3) and metrics logging (Phase 4.1).
- **Weekly portfolio review:** Phase 4.5 across all 5 businesses.

See `NEWSLETTER_SYSTEM.md` for the staged rollout (don't launch all 5 at once).
