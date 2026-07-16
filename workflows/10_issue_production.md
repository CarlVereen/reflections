# Workflow 10 — Issue Production Pipeline

**Objective:** Produce one newsletter issue that is accurate, on-voice, and ready to
send. This is the assembly line that runs every week for each newsletter.

**Required inputs:**
- `newsletter_id` (which of the 5 businesses)
- Access to the idea backlog for that newsletter
- The newsletter's positioning brief (voice, avatar, pillars) from Phase 0.2

**Expected output:** A sent (or scheduled) issue, archived to the web, logged, with a
verification record attached.

**Hard rule:** An issue may not be sent unless **both** the Fact-Checker (step 3) and
the Quality Gate (step 6) return PASS. No exceptions. Unverifiable claims are cut, not
guessed.

---

## Step 1 — Topic & angle selection  · *Editorial Planner agent*

1. Read the backlog: `tools/read_backlog.py --newsletter <id>`.
2. Score candidate topics on: timeliness, reader value, monetization tie-in, and
   whether enough public source material exists to write it truthfully.
3. Pick one topic. Write a 3-sentence angle brief: what the reader learns, why now,
   and the one takeaway.
4. If no topic clears the bar, trigger a backlog refill (Phase 0.6 mini-run) instead
   of forcing a weak issue.

**Output:** `angle_brief` → handed to Research.

---

## Step 2 — Research  · *Research agent*

1. From the angle brief, list the specific questions the issue must answer.
2. Gather sources for each question:
   - `tools/web_search.py "<query>"` for discovery
   - `tools/fetch_url.py <url>` to pull full text of promising results
   - `tools/rss_ingest.py --feeds <niche_feeds>` for latest developments
3. For every fact you intend to use, record a **source record**:
   `{claim, source_url, exact_quote_or_data, date_accessed}`.
4. Do NOT paraphrase into a "fact" anything you could not pull a quote/data point for.
   Mark thin areas as `NEEDS_SOURCE` rather than filling the gap from memory.

**Output:** `research_pack` = angle brief + ordered source records → handed to Fact-Checker.

---

## Step 3 — Verification  · *Fact-Checker agent*  · **GATE**

This is the anti-fabrication gate. For each source record:

1. Re-open the source: `tools/fact_source_check.py --url <url> --claim "<claim>"`.
   The tool re-fetches the page and confirms the quote/data is actually present.
2. Mark each claim `VERIFIED`, `UNSUPPORTED` (source doesn't say it), or `DEAD`
   (source unreachable).
3. Rules:
   - `VERIFIED` → may be used.
   - `UNSUPPORTED` / `DEAD` → the claim is **cut**, or Research must find a real source
     before it can return.
   - Any statistic, quote, price, date, or named-entity claim requires a `VERIFIED`
     record. Opinion/analysis is allowed but must be labeled as the newsletter's take,
     not presented as external fact.
4. Produce a `verification_record` listing every claim and its status.

**Gate:** If any claim shipping in the draft is not `VERIFIED`, this step returns
**FAIL** and the draft cannot proceed until fixed.

**Output:** `verified_research_pack` + `verification_record` → handed to Writer.

---

## Step 4 — Drafting  · *Writer agent*

1. Load the positioning brief (voice, avatar, pillars).
2. Write the issue using **only** `VERIFIED` claims from the pack. Structure:
   - Hook (why this matters to the reader now)
   - Body (the substance, in the newsletter's format — see per-niche template)
   - Takeaway (what to do / remember)
   - One soft monetization CTA if appropriate (from Phase 3.2)
3. Every external fact in the draft must carry its source link inline or as a footnote.
4. Never introduce a new fact at drafting time that isn't in the verified pack. If the
   draft needs one, kick back to Research — do not invent it.

**Output:** `draft_v1` → handed to Editor.

---

## Step 5 — Editing  · *Editor agent*

1. Tighten for clarity, flow, and length appropriate to the format.
2. Enforce voice consistency against the positioning brief.
3. Check that every claim still has its source link after edits.
4. Confirm the CTA is honest (no hype, no false scarcity).

**Output:** `draft_final` → handed to Quality Gate.

---

## Step 6 — Quality & Compliance Gate  · *Quality Gate agent*  · **GATE**

Automated + judgment checks before send:

1. **Sourcing check:** cross-reference `draft_final` against `verification_record` —
   every factual sentence maps to a `VERIFIED` claim. Any orphan fact → FAIL.
2. **Link check:** `tools/link_check.py` — all links resolve (200 OK), no broken/placeholder URLs.
3. **Disclosure check:** any affiliate/partner link is clearly disclosed (FTC-style).
4. **Deliverability check:** `tools/spam_score.py` — subject + body pass spam scoring;
   no spammy phrasing, balanced text/link ratio.
5. **Brand-safety check:** tone matches the niche; no unverified medical/financial/legal
   advice presented as fact (add disclaimers where the niche requires).

**Gate:** All five checks PASS → proceed. Any FAIL → return to the responsible step.

**Output:** `send_ready_issue`.

---

## Step 7 — Render, schedule & send  · *Publisher agent*

1. `tools/render_email.py` — convert `send_ready_issue` (markdown) → email-safe HTML.
2. Set subject line (Editor supplies 2–3 options; Analytics may A/B in Phase 4).
3. `tools/send_newsletter.py --newsletter <id> --schedule <time>` — send or schedule
   via the ESP.
4. Confirm send receipt / scheduled status.

---

## Step 8 — Distribute  · *Publisher + Growth agents*

1. `tools/publish_web_archive.py` — post the issue to the public web archive (evergreen
   SEO surface, powers discovery for a zero-audience start).
2. `tools/social_post.py` — post a teaser + link to the channels where the avatar lives.

---

## Step 9 — Log & refill  · *Editorial Planner agent*

1. Record the issue (topic, send time, verification record) to the newsletter's log.
2. Mark used backlog topic as done; add any spin-off ideas discovered during research
   back to the backlog via `tools/store_idea.py`.

---

## Failure handling (WAT self-improvement)

- Tool error → read the full trace, fix the tool, retest; if it uses paid API credits,
  check with the operator before re-running (per CLAUDE.md).
- Recurring quality failure of one type → update this workflow's relevant step so it
  can't recur, and note the constraint (e.g. an ESP rate limit, a source that changed
  its layout).
