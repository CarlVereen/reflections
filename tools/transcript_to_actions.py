#!/usr/bin/env python3
"""
transcript_to_actions.py — Turn a raw meeting transcript into clean,
client-ready notes: a summary, decisions, and an action-item table.

Sellable deliverable: "$75 per meeting — send me your recording/transcript,
get back a formatted notes doc with owners and due dates the same day."

Usage:
    python tools/transcript_to_actions.py transcript.txt notes.md

It uses simple, transparent heuristics (no paid API) to extract:
    - Action items   (lines with will/need to/action/todo/follow up/by <date>)
    - Decisions      (lines with decided/agreed/we'll go with/approved)
    - Owners         (a capitalized name near the start of an action line)
Then writes a tidy Markdown file you can paste into Notion/Google Docs.

For higher-quality extraction, an agent (me) can post-edit the output —
this script does the deterministic 80% so the result is consistent.
"""
import re
import sys

ACTION_HINTS = re.compile(
    r"\b(will|need to|needs to|action|to-?do|follow ?up|by (mon|tue|wed|thu|fri|next|tomorrow)|"
    r"send|prepare|draft|schedule|set up|create|email|call)\b",
    re.I,
)
DECISION_HINTS = re.compile(
    r"\b(decided|agreed|we'?ll go with|approved|final|signed off|conclusion)\b", re.I
)
NAME_RE = re.compile(r"\b([A-Z][a-z]+)\b")


def split_sentences(text: str):
    # Split on sentence boundaries and newlines.
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [p.strip() for p in parts if p.strip()]


def guess_owner(sentence: str) -> str:
    m = NAME_RE.search(sentence)
    return m.group(1) if m else "Unassigned"


def convert(in_path: str, out_path: str) -> None:
    with open(in_path, encoding="utf-8") as f:
        text = f.read()

    sentences = split_sentences(text)
    actions, decisions = [], []
    for s in sentences:
        if DECISION_HINTS.search(s):
            decisions.append(s)
        elif ACTION_HINTS.search(s):
            actions.append(s)

    # Summary = first 3 substantive sentences.
    summary = sentences[:3]

    lines = []
    lines.append("# Meeting Notes\n")
    lines.append("## Summary\n")
    lines.extend(f"- {s}" for s in summary)
    lines.append("\n## Decisions\n")
    lines.extend(f"- {s}" for s in decisions) if decisions else lines.append("- _None captured_")
    lines.append("\n## Action Items\n")
    if actions:
        lines.append("| Owner | Action | Status |")
        lines.append("|-------|--------|--------|")
        for a in actions:
            lines.append(f"| {guess_owner(a)} | {a} | ☐ Open |")
    else:
        lines.append("_No action items detected._")
    lines.append("\n---")
    lines.append("_Draft generated from transcript. Review owners/dates before sending to client._")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print("=== Transcript → Notes ===")
    print(f"Sentences parsed: {len(sentences)}")
    print(f"Decisions found:  {len(decisions)}")
    print(f"Action items:     {len(actions)}")
    print(f"Saved to:         {out_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python tools/transcript_to_actions.py transcript.txt notes.md")
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
