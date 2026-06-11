# SEO Site Factory — Strategy & Architecture

> A repeatable pipeline that takes a **niche** (discovered by an agent or supplied),
> spins up a **complete website with a built-in organic-traffic engine**, and
> **monetizes** it. Run a portfolio of these as income-producing assets.

Status: **Draft v1 — strategy/architecture only, no code yet.**
Owner: Carl
Framework: WAT (Workflows / Agents / Tools) — see `/CLAUDE.md`

---

## 1. The thesis (and the honest reality)

**Goal:** "Pump out a bunch of sites that drive organic traffic without paid ads, and monetize them."

**What actually drives organic traffic** breaks into four levers:

| Lever | Automatable | Role |
|---|---|---|
| Technical SEO (speed, schema, sitemaps, crawlability) | ✅ Fully | Makes a site *eligible* to rank. A floor, not a driver. |
| **Content that matches search demand** | ✅ This is the engine | ~90% of the traffic. The whole game. |
| **Measurement → improvement loop** | ✅ Fully | The "improves automatically" part. The flywheel. |
| Backlinks / authority | ⚠️ Mostly not | Cannot be safely automated. Skip aggressive automation. |

So the buildable core is: **content engine + technical SEO automation + a measurement feedback loop**, wrapped in a **scaffolder** that clones the whole thing per niche.

### The one trap that kills this model

Google's **"scaled content abuse"** policy (March 2024) actively de-indexes mass-produced thin AI content. "AI writes 5,000 pages → profit" is a **penalty machine**, not a business.

The version that works = **programmatic SEO with real utility**:
- Pages built on **real data** (prices, specs, stats, comparisons, calculators), not just prose.
- Each page answers a **specific search intent** genuinely better than what ranks now.
- **E-E-A-T signals** (named authors, sources, freshness, about pages).
- A loop that **prunes losers and doubles down on winners**.

> **Portfolio = risk management.** Because any single site can catch a penalty, owning 10–30 small sites is *safer* than betting everything on one big one. The factory model and the diversification strategy reinforce each other.

---

## 2. Monetization (decide per site, or mix)

| Model | How it pays | Best when | Time to first $ |
|---|---|---|---|
| **Affiliate content** (Amazon, niche programs) | Commission on referred sales | Product research / "best X" / comparison niches | 3–6 mo |
| **Display ads** (AdSense → Ezoic/Mediavine) | Per 1k pageviews (RPM $5–40) | High-volume info content | 4–8 mo (traffic thresholds) |
| **Lead generation** | Sell leads to local businesses ($5–100/lead) | Local service niches ("plumber in <city>") | 2–5 mo |
| **Build-and-flip** | Sell the asset (Flippa/Empire Flippers, 30–45× monthly profit) | Once a site has steady revenue | 6–12 mo |
| **Productize the engine (SaaS)** | Sell the factory to others | After it's proven on your own portfolio | Later |

**Recommended starting blend:** Affiliate + Display ads for info/product niches; Lead-gen for local niches. Build the asset first, flip optional. SaaS is a *later* spin-off once the engine is proven — don't start there.

---

## 3. Architecture — the factory

Each layer is a WAT stage. The factory runs Layers 0→7 to birth a site, then Layer 6 runs forever on a schedule.

```
                         ┌─────────────────────────────────────┐
                         │  L0  NICHE / OPPORTUNITY ENGINE       │
   niche provided ──────▶│  (agent research OR human input)      │
                         │  → scored "niche brief"               │
                         └───────────────┬─────────────────────┘
                                         ▼
                         ┌─────────────────────────────────────┐
                         │  L1  SITE SCAFFOLDER                  │
                         │  name, brand, theme, repo, deploy     │
                         └───────────────┬─────────────────────┘
                                         ▼
                         ┌─────────────────────────────────────┐
                         │  L2  KEYWORD + CONTENT PLAN           │
                         │  cluster → pillar + programmatic map  │
                         └───────────────┬─────────────────────┘
                                         ▼
                         ┌─────────────────────────────────────┐
                         │  L3  CONTENT ENGINE                   │
                         │  templates + real data + LLM          │
                         │  + fact-check + internal links        │
                         └───────────────┬─────────────────────┘
                                         ▼
                         ┌─────────────────────────────────────┐
                         │  L4  TECHNICAL SEO                    │
                         │  schema, meta, sitemap, perf, mobile  │
                         └───────────────┬─────────────────────┘
                                         ▼
                         ┌─────────────────────────────────────┐
                         │  L5  PUBLISH / HOST  (git → deploy)   │
                         └───────────────┬─────────────────────┘
                                         ▼
                         ┌─────────────────────────────────────┐
                         │  L7  MONETIZATION                     │
                         │  affiliate links, ad slots, lead form │
                         └───────────────┬─────────────────────┘
                                         ▼
        ┌───────────────────────────────────────────────────────────┐
        │  L6  MEASURE → IMPROVE LOOP  (runs on a schedule forever)  │
        │  Search Console + analytics → find winners/losers          │
        │  → generate more around winners, prune/refresh losers      │
        └───────────────────────────────────────────────────────────┘
                                    ▲   │
                                    └───┘  feeds back into L2/L3
```

### Layer detail

**L0 — Niche / Opportunity Engine** *(the "researched by an agent" path)*
- Input: a seed topic, or "find me a niche."
- Scores candidate niches on: search volume × **low competition** (keyword difficulty) × **monetization potential** (affiliate payout / ad RPM / lead value) × content feasibility.
- Output: a **niche brief** (target audience, seed keywords, monetization model, competitor set, content angles).
- Tools: keyword/SERP data (DataForSEO or similar), competitor scrape, LLM scoring.

**L1 — Site Scaffolder**
- From the niche brief: generate site name + domain candidates, brand/logo, choose a theme, create the repo from a template, wire up the deploy target.
- Output: a live empty site at a real URL.

**L2 — Keyword + Content Plan**
- Expand seed keywords → cluster into **topic groups**.
- Define **pillar pages** (broad authority) + **programmatic templates** (e.g. `{product} vs {product}`, `{service} cost in {city}`, `best {product} for {use-case}`).
- Output: a content map (the build queue).

**L3 — Content Engine** *(reuses your existing `tools/research_topic.py` + `tools/claude_client.py`)*
- For each planned page: gather **real data**, fill the template, draft with LLM, **fact-check**, add internal links, attach author/E-E-A-T metadata.
- Quality gate before publish (no thin pages).

**L4 — Technical SEO**
- Auto: schema.org markup, title/meta, OpenGraph, XML sitemap, robots.txt, canonical tags, image alt, Core Web Vitals budget, mobile.

**L5 — Publish / Host**
- Git-based: content committed → CI builds → deploys. Keeps everything versioned (fits WAT).

**L7 — Monetization**
- Inject affiliate links, ad slots, or lead-capture forms per the niche brief's chosen model.

**L6 — Measure → Improve Loop** *(the "improves automatically" core)*
- Pull **Google Search Console** (impressions, clicks, position, queries) + analytics.
- Identify: **winners** (rising/near page-1 → generate more cluster pages, expand), **losers** (stale/thin → refresh or prune), **striking distance** (positions 5–20 → optimize to climb).
- Feeds new work back into L2/L3. Runs on a schedule (e.g. weekly via GitHub Actions cron).

---

## 4. Recommended tech stack

| Concern | Pick | Why |
|---|---|---|
| Site generator | **Astro** (content collections, MDX) | Fast, SEO-first, great for thousands of programmatic pages; ships minimal JS |
| Content storage | **Markdown/MDX in git** | Free, versioned, simple, agent-friendly. No DB to run |
| Hosting | **Cloudflare Pages** (or Vercel) | Free tier, fast global CDN, scales to many sites |
| Keyword/SERP data | **DataForSEO API** (or Search Console for owned sites) | Programmatic access; avoid fragile scraping |
| Measurement | **Google Search Console API** + **GA4** | Free, authoritative, the loop's data source |
| LLM | **Claude** via your `claude_client.py` | Already in repo |
| Orchestration | Your `agent_orchestrator.py` / `run_team.py` + **GitHub Actions cron** | Free scheduling, git-native |

### Model choice (cost matters at scale)
- **Niche scoring / strategy / content planning** → `claude-opus-4-8` (judgment-heavy, low volume).
- **Per-page drafting at volume** → `claude-haiku-4-5-20251001` for bulk, `claude-sonnet-4-6` for flagship/pillar pages where quality must be high.
- Mixing tiers is the difference between a profitable and an unprofitable factory. (Confirm current pricing via the `claude-api` skill before committing a budget.)

---

## 5. WAT mapping (what we'd actually build)

```
workflows/
  find_niche.md            # L0
  scaffold_site.md         # L1
  plan_content.md          # L2
  generate_page.md         # L3
  technical_audit.md       # L4
  publish.md               # L5
  measure_and_improve.md   # L6
  monetize.md              # L7

tools/
  niche_scorer.py          # keyword × competition × $ scoring
  serp_client.py           # keyword/SERP data
  site_scaffolder.py       # clone template → live URL
  keyword_cluster.py       # cluster + content map
  page_generator.py        # reuses research_topic.py + claude_client.py
  schema_injector.py       # technical SEO
  search_console_client.py # measurement
  rank_analyzer.py         # winners/losers/striking-distance

site-template/             # the Astro site cloned per niche
```

---

## 6. KPIs & economics (set honest expectations)

- **SEO is slow.** Meaningful traffic typically starts **3–6 months** after publishing; compounding after that.
- **Per-site revenue is modest individually** ($50–500/mo is a realistic mature small site); the **portfolio** is where it adds up.
- Per-site KPIs: indexed pages, impressions, clicks, avg position, page-1 keywords, revenue, **revenue ÷ generation cost**.
- Factory KPIs: cost-per-site to launch, time-to-launch, % of sites that reach traffic threshold, portfolio revenue.

**Unit economics to validate in Phase 1:** LLM + data cost to produce N pages vs. projected revenue per site. If a site costs $X to build and earns $Y/mo, the model lives or dies on X, Y, and survival rate.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Google penalty for scaled/thin content | Real-data programmatic pages, quality gate, E-E-A-T, prune losers |
| Algorithm update wipes a site | Portfolio diversification (many small sites > one big) |
| Content cost > revenue | Tiered models (Haiku bulk / Sonnet flagship), measure unit economics in Phase 1 |
| Affiliate/ad program rejection (low traffic/quality) | Hit traffic thresholds first; don't over-monetize early |
| Scraping fragility / ToS | Use official data APIs (DataForSEO, Search Console) |
| Duplicate sites look like a network (footprint) | Vary branding/design/hosting; genuinely different content per niche |

---

## 8. Roadmap

**Phase 0 — Strategy (this doc).** ✅

**Phase 1 — One site, end-to-end, by hand-ish.** Prove the flywheel on a *single* niche:
L2→L7 manually orchestrated, ~20–50 real pages, deployed, Search Console connected. Goal: validate that pages get indexed and the unit economics make sense. **Do not build the factory yet.**

**Phase 2 — Automate the loop (L6).** Connect Search Console → rank analyzer → auto-generate cluster expansions on winners. This is the part that "improves SEO automatically."

**Phase 3 — Templatize (L1) + niche engine (L0).** Turn the proven Phase-1 site into a clonable template; build the niche scorer so new sites can be spun up from a brief.

**Phase 4 — Scale the portfolio.** Run the factory, monitor cohorts, flip or hold.

**Phase 5 (optional) — Productize as SaaS** once the engine is proven on your own assets.

> Principle: **prove the flywheel on one site before building the machine that makes many.** The biggest failure mode is building an elaborate factory that mass-produces sites Google ignores.

---

## 9. Open decisions for next session

1. **Niche path:** let the L0 agent find one, or supply a seed? (Phase 1 goes faster with a supplied niche.)
2. **Primary monetization** for the first site: affiliate, ads, or lead-gen? (Shapes content + page templates.)
3. **Domain/brand:** real domain now, or build on a free subdomain to validate first?
4. **Budget ceiling** for Phase 1 (caps LLM + data spend and forces the tiered-model design).
