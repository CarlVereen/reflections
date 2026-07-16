# The Assembly Line — Pipeline Contract

This is how the newsletter agents connect. Each agent is **one station** on the line.
A single work-piece — the **issue packet** — moves station to station, each agent adding
its part and passing it on. Because every station reads and writes the same standard
packet, you can **swap or edit any one agent without breaking its neighbors** — that's
the whole point of building it this way.

Each station is defined as its own file in `.claude/agents/nl-*.md`. Edit one file to
adjust that station. Nothing else needs to change as long as the packet contract holds.

---

## The line (nothing → delivery → consistency)

```
FROM NOTHING → DELIVERY (runs once per issue)
  nl-launcher ──(one-time per newsletter)──┐
                                           ▼
  nl-planner → nl-researcher → nl-factchecker[GATE] → nl-writer
     → nl-copyeditor → nl-quality-gate[GATE] → nl-publisher → DELIVERED

FROM DELIVERY → CONSISTENCY (runs continuously)
  nl-growth      (build a free audience)
  nl-analyst     (measure; decide when interest is "proven")
  nl-monetizer   (DORMANT until nl-analyst says interest is proven)
```

**Line manager:** the top-level assistant plays "Editor-in-Chief" — it invokes each
station agent in order, passes the packet, and enforces the two gates. (Station agents
don't call other station agents; the line manager sequences them.)

---

## The work-piece: the issue packet

One JSON file per issue is the standard "part" that travels the line. Every station
reads it, fills in its field, advances `station`, appends to `history`, and saves it.

Location: `.tmp/<newsletter_id>/issues/<issue_id>/packet.json`

```json
{
  "newsletter_id": "govcon",
  "issue_id": "2026-07-16",
  "station": "researcher",            // whose turn it is now
  "history": [                        // audit trail
    {"station": "planner", "at": "...", "result": "ok"}
  ],
  "angle_brief":         { },          // ← nl-planner
  "research_pack":       { "claims": [ {"claim":"", "source_url":"", "quote_or_data":"", "date_accessed":""} ] },  // ← nl-researcher
  "verification_record": [ {"claim":"", "status":"VERIFIED|UNSUPPORTED|DEAD", "source_url":""} ],                  // ← nl-factchecker
  "draft":               "",           // ← nl-writer (markdown)
  "edited_draft":        "",           // ← nl-copyeditor (markdown)
  "qa_report":           { "checks": {}, "verdict": "PASS|FAIL", "reasons": [] },  // ← nl-quality-gate
  "delivery_record":     { "sent_at":"", "archive_url":"", "channel":"" }          // ← nl-publisher
}
```

### Station I/O contract (reads → writes → next)

| Station | Reads | Writes | Advances to | Gate? |
|---------|-------|--------|-------------|-------|
| nl-planner | backlog, config | `angle_brief` | researcher | |
| nl-researcher | `angle_brief` | `research_pack` | factchecker | |
| nl-factchecker | `research_pack` | `verification_record` | writer *(if PASS)* | **GATE** |
| nl-writer | verified pack, config | `draft` | copyeditor | |
| nl-copyeditor | `draft`, config | `edited_draft` | quality-gate | |
| nl-quality-gate | `edited_draft`, `verification_record` | `qa_report` | publisher *(if PASS)* | **GATE** |
| nl-publisher | `edited_draft`, `qa_report` | `delivery_record` | done | |

**Gate rule:** a GATE that returns FAIL sets `station` back to the responsible upstream
station with `reasons`, and the line manager re-runs from there. An issue never ships
with an unverified fact or a failed QA check.

---

## Persistent vs. disposable

- **Persistent (committed to git):** each newsletter's identity lives in
  `newsletters/<newsletter_id>/config.md` — niche, reader avatar, voice, content pillars,
  money model, and the "proven interest" thresholds. Agents read this; it's the dial you
  turn to re-aim a newsletter.
- **Disposable (`.tmp/`, regenerable):** packets, drafts, research, metrics caches.

---

## The "launch free, monetize once proven" rule

`nl-monetizer` stays **dormant** by default. It only activates for a newsletter after
`nl-analyst` reports that the newsletter has crossed its **proven-interest threshold**
(defined per newsletter in its `config.md`; sensible starting defaults live in
`nl-analyst.md`). Until then, every newsletter runs 100% free — publish, grow, measure.
This is enforced by the line manager: it does not invoke `nl-monetizer` for a newsletter
whose `analyst` verdict is `interest: not-yet-proven`.

---

## How to adjust an agent (the reason for this design)

1. Open its file: `.claude/agents/nl-<station>.md`.
2. Edit its instructions, tools (frontmatter), or model.
3. Change nothing else — as long as it still reads/writes the same packet fields, the
   rest of the line is unaffected.

To add a new station, insert it in the table above, give it packet fields to read/write,
and drop a new `.claude/agents/nl-*.md` file in place. To remove one, wire its neighbors'
`advances to` around it.
