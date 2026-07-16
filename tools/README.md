# Tools Catalog

Per the WAT framework, tools are **deterministic Python scripts** in `tools/` that do the
actual execution. Agents call them; they don't improvise the work themselves.

**Status honesty:** None of these are implemented yet — this is the spec. Each is marked
with what it needs. Anything requiring an external account or paid API is **[NEEDS
OPERATOR]**: the operator must create the account and put credentials in `.env` (never
anywhere else, per CLAUDE.md). The agents will not fabricate API access or pretend a
send/charge happened.

Build order matches the roadmap in `NEWSLETTER_SYSTEM.md` — build a tool when the step
that needs it comes up, not all at once.

| Tool | Purpose | Inputs → Outputs | Needs | Status |
|------|---------|------------------|-------|--------|
| `web_search.py` | Discovery search for Research/Analyst | query → ranked results | Search API key **[NEEDS OPERATOR]** | spec |
| `fetch_url.py` | Pull full text of a page | url → clean text + metadata | none (HTTP) | spec |
| `rss_ingest.py` | Pull latest items from niche feeds | feed list → dated items | none (HTTP) | spec |
| `fact_source_check.py` | Re-fetch a source & confirm a quote/data is present | url + claim → VERIFIED/UNSUPPORTED/DEAD | none (HTTP) | spec |
| `store_idea.py` | Append a topic to a newsletter's backlog | idea record → backlog store | local store or Notion API | spec |
| `read_backlog.py` | Read/rank backlog topics | newsletter id → topics | same store | spec |
| `render_email.py` | Markdown issue → email-safe HTML | markdown → HTML | none | spec |
| `send_newsletter.py` | Send/schedule an issue via the ESP | issue + schedule → send receipt | ESP API **[NEEDS OPERATOR]** | spec |
| `esp_admin.py` | List/audience/automation/referral/DNS-record config | commands → ESP state | ESP API **[NEEDS OPERATOR]** | spec |
| `render_page.py` | Build a landing / lead-magnet / lead-gen page | content → hosted page | host (ESP or static) **[NEEDS OPERATOR]** | spec |
| `publish_web_archive.py` | Post an issue to the public web archive (SEO surface) | issue → live URL | host **[NEEDS OPERATOR]** | spec |
| `social_post.py` | Schedule teasers to social/community channels | post → scheduled | platform APIs **[NEEDS OPERATOR]** | spec |
| `create_checkout.py` | Create subscription/product/affiliate checkout objects | offer → payment link | payment API **[NEEDS OPERATOR]** | spec |
| `link_check.py` | Verify all links in a draft resolve (200) | draft → pass/fail + broken list | none (HTTP) | spec |
| `spam_score.py` | Score subject+body for deliverability | draft → score + flags | scoring API or local heuristic | spec |
| `track_metrics.py` | Pull ESP + payment metrics; portfolio dashboard | newsletter/portfolio → metrics table | ESP + payment APIs **[NEEDS OPERATOR]** | spec |

## Notes on realistic implementation

- **Some of these can be backed by MCP servers already connected to this workspace**
  (e.g. Notion for the idea backlog/editorial DB, Google Drive for deliverables). Where
  an MCP tool already does the job, the "Python tool" can be a thin wrapper — we don't
  reinvent it. Confirm with the operator before wiring these in.
- **Email sending needs a real ESP.** Gmail is not a bulk sender; do not use it as one.
  The ESP is chosen in `workflows/50_infrastructure_setup.md` step 1 and its price is
  *verified live* at setup, not assumed.
- **`.env` is the only home for secrets.** Never hardcode keys in a tool or commit them.
- **Paid-API guardrail:** before re-running any tool that spends credits/money, check
  with the operator (CLAUDE.md rule).

## Contract every tool follows

1. Deterministic: same inputs → same outputs; no hidden model calls inside a "tool."
2. Fails loud: on error, return a clear message + exit non-zero so the agent can react.
3. Logs what it did (for the Analytics/self-improvement loop).
4. Never fabricates: a tool reports real results or an error — never a plausible guess.
