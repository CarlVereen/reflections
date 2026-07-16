# Agent Roster

These are the agents that run the newsletter businesses. In WAT terms, each agent is a
scoped decision-maker: it reads a workflow, calls deterministic tools in sequence,
handles failures, and hands a defined output to the next agent. One **Managing Editor**
orchestrates them per newsletter; the specialists do the focused work.

Each agent below lists: **Role · Inputs · Tools · Outputs · Hands off to.**

> **Implementation status:** these roles are now built as real, individually-editable
> assembly-line agents in `.claude/agents/nl-*.md`, connected by the packet contract in
> `agents/PIPELINE.md`. Mapping (conceptual role → built agent file):
> - Market Analyst → folded into **nl-launcher** (one-time setup) + **nl-analyst** (ongoing)
> - Editorial Planner → **nl-planner** · Research → **nl-researcher** · Fact-Checker →
>   **nl-factchecker** · Writer → **nl-writer** · Editor → **nl-copyeditor** · Quality
>   Gate → **nl-quality-gate** · Publisher → **nl-publisher** · Growth → **nl-growth** ·
>   Monetization → **nl-monetizer** · Analytics → **nl-analyst**
> - Managing Editor (orchestrator) → the **line manager** = the top-level assistant that
>   sequences the stations (station agents don't spawn other station agents).
>
> This roster is the design rationale; the `.claude/agents/` files are the live agents you
> edit to adjust a station. Edit one file to change one station — nothing else breaks as
> long as the packet contract holds.

---

## 0. Managing Editor (Orchestrator)
- **Role:** Runs the full lifecycle (workflow 00) for one newsletter. Decides what runs
  when, resolves handoff failures, enforces the two hard gates (Fact-Check, Quality),
  and runs the weekly portfolio review across all 5.
- **Inputs:** newsletter config, calendar, prior metrics.
- **Tools:** none directly — delegates; may call `track_metrics` for the portfolio view.
- **Outputs:** a shipped issue per week + a portfolio decision (grow/hold/kill).
- **Hands off to:** every specialist below.

---

## 1. Market Analyst
- **Role:** Phase 0 niche validation, positioning, competitor & willingness-to-pay
  research; ongoing competitor monitoring.
- **Inputs:** candidate niche, avatar hypothesis.
- **Tools:** `web_search`, `fetch_url`, `rss_ingest`.
- **Outputs:** niche validation memo (go/no-go), positioning brief, stack recommendation.
- **Hands off to:** Editorial Planner, Monetization, Publisher.

## 2. Editorial Planner
- **Role:** Owns the idea backlog and the calendar; selects each issue's topic & angle.
- **Inputs:** positioning brief, backlog, trending sources.
- **Tools:** `rss_ingest`, `web_search`, `store_idea`, `read_backlog`.
- **Outputs:** angle brief per issue; maintained backlog & issue log.
- **Hands off to:** Research.

## 3. Research
- **Role:** Gathers real source material for the issue and records every source.
- **Inputs:** angle brief.
- **Tools:** `web_search`, `fetch_url`, `rss_ingest`.
- **Outputs:** research pack (claims + source records with quotes/data + URLs).
- **Hands off to:** Fact-Checker.

## 4. Fact-Checker  · **GATE**
- **Role:** Verifies every factual claim against its live source. The anti-fabrication
  gate. Cuts anything unverifiable.
- **Inputs:** research pack.
- **Tools:** `fact_source_check`.
- **Outputs:** verified research pack + verification record (per-claim status).
- **Hands off to:** Writer (only if PASS).

## 5. Writer
- **Role:** Drafts the issue in the newsletter's voice using only verified claims.
- **Inputs:** verified research pack, positioning brief.
- **Tools:** none (writing) — must not introduce unverified facts.
- **Outputs:** draft v1 with inline source links + a soft CTA where appropriate.
- **Hands off to:** Editor.

## 6. Editor
- **Role:** Polishes structure, clarity, voice; keeps every claim's source attached.
- **Inputs:** draft v1.
- **Tools:** none.
- **Outputs:** final draft + 2–3 subject-line options.
- **Hands off to:** Quality Gate.

## 7. Quality Gate  · **GATE**
- **Role:** Final pre-send checks: sourcing map, links, disclosures, spam score,
  brand safety.
- **Inputs:** final draft, verification record.
- **Tools:** `link_check`, `spam_score`.
- **Outputs:** send-ready issue (or a FAIL kickback with reasons).
- **Hands off to:** Publisher (only if PASS).

## 8. Publisher
- **Role:** Renders to email HTML, schedules/sends, archives to web, coordinates social.
- **Inputs:** send-ready issue.
- **Tools:** `render_email`, `send_newsletter`, `publish_web_archive`, `esp_admin`,
  `render_page`.
- **Outputs:** sent/scheduled issue + live archive page.
- **Hands off to:** Growth (distribution), Analytics (logging).

## 9. Growth
- **Role:** Audience acquisition from zero — lead magnets, SEO archive, community/social
  distribution, referral loop, deliverability/list hygiene.
- **Inputs:** issue archive, avatar channel map.
- **Tools:** `render_page`, `publish_web_archive`, `social_post`, `esp_admin`.
- **Outputs:** growth actions + source-attributed signups.
- **Hands off to:** Analytics.

## 10. Monetization
- **Role:** Builds & runs the four non-ad money models; weaves honest CTAs; tracks
  offers.
- **Inputs:** list size/engagement, reader questions, offer performance.
- **Tools:** `create_checkout`, `render_page`, `send_newsletter`.
- **Outputs:** live offers, sales sequences, disclosed affiliate placements, lead-gen
  funnel.
- **Hands off to:** Analytics.

## 11. Analytics
- **Role:** Pulls real metrics, diagnoses, designs one experiment at a time, reports.
- **Inputs:** ESP + payment data.
- **Tools:** `track_metrics`.
- **Outputs:** weekly metrics + diagnosis + experiment + portfolio dashboard.
- **Hands off to:** Managing Editor (for go/grow/kill decisions).

---

## Handoff chain (per issue)

```
Managing Editor
  → Editorial Planner → Research → Fact-Checker [GATE]
  → Writer → Editor → Quality Gate [GATE]
  → Publisher → Growth + Analytics
```

## Failure & escalation rules

- A **GATE** FAIL never proceeds — it returns to the responsible upstream agent.
- A tool error is fixed per the CLAUDE.md self-improvement loop; paid-API retries need
  operator sign-off.
- Anything requiring money, credentials, or an external account (**[NEEDS OPERATOR]**)
  is escalated to the operator, never faked.
- When an agent is uncertain about a fact, it escalates or cuts — it does not invent.

## Implementation note

In this repo, each "agent" can be realized as either (a) a scoped subagent invocation
with the role prompt above, or (b) the Managing Editor (you) executing the role's steps
directly against the tools. Start with (b) for simplicity; split into dedicated
subagents as volume across 5 newsletters grows. Either way, the role boundaries and
gates above stay fixed.
