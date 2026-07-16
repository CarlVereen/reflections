# Workflow 40 — Analytics & Improvement

**Objective:** Measure what's real, learn from it, and feed improvements back into the
workflows. This is the WAT self-improvement loop applied to the whole business.
Owner: Analytics agent + Managing Editor.

---

## Step 1 — Collect (weekly, per newsletter)

Pull real numbers via `tools/track_metrics.py --newsletter <id>`:
- Delivery: sent, delivered, bounce %, complaint %
- Engagement: open %, click %, top links
- Growth: net new subs, by source; unsub %
- Revenue: by offer (subscription MRR, product sales, service leads, affiliate)

Store to the newsletter's metrics log. **Never estimate a number the tool can pull —
report the real one or report that it's unavailable.**

---

## Step 2 — Diagnose

1. Compare against the prior period and against the other 4 newsletters.
2. Identify the single biggest lever this week (e.g. opens fine but clicks low →
   content/CTA problem; growth flat → acquisition problem).
3. Write a 3-bullet diagnosis. No spin.

---

## Step 3 — Experiment (one at a time)

1. Design ONE experiment targeting the biggest lever:
   - Subject-line A/B, send-time test, format change, new lead-magnet, offer/price test.
2. Define the success metric and how long to run it before deciding.
3. Only one variable per experiment so results are attributable.

---

## Step 4 — Feed back into the system

1. If the experiment wins, update the relevant workflow file so the win becomes the new
   default (e.g. update workflow 10 step 7 with the better subject-line pattern).
2. If a tool caused friction, fix the tool and note the constraint (per CLAUDE.md loop).
3. Log the learning so it isn't rediscovered.

---

## Step 5 — Portfolio review (weekly, across all 5)

Managing Editor reviews all newsletters together:
- Which newsletter earns the most per subscriber? Per hour of agent effort?
- Which is worth **more** investment, which should be **paused or killed**?
- Reallocate effort accordingly. Not all 5 will win — the portfolio approach exists so
  the winners fund the learning from the ones that don't.

**Kill criteria (decide honestly):** if a newsletter shows no path to revenue after an
agreed trial window (e.g. no product sales, flat growth, low engagement despite fixes),
recommend pausing it and reallocating to a working one — and tell the operator plainly.

---

## The portfolio dashboard

`tools/track_metrics.py --portfolio` produces one table across all 5 newsletters:
subscribers, weekly growth, engagement, and revenue-by-model — the single view the
operator uses to make go/grow/kill calls.
