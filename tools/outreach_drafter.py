#!/usr/bin/env python3
"""
outreach_drafter.py — Generate personalized cold/warm outreach emails from a
CSV of prospects + a template. This is how YOU get your first clients, and
it's also a service you can sell ("I'll write & personalize 50 outreach emails").

Usage:
    python tools/outreach_drafter.py prospects.csv template.txt out_dir/

prospects.csv must have a header row. Any {column} in the template is replaced
with that row's value, e.g. {first_name}, {company}, {pain_point}.

Each draft is written as a separate .txt file in out_dir/ ready to paste into
Gmail (or to be sent via the connected Gmail tools after your review).
"""
import csv
import os
import sys


def draft(csv_path: str, template_path: str, out_dir: str) -> None:
    with open(template_path, encoding="utf-8") as f:
        template = f.read()
    os.makedirs(out_dir, exist_ok=True)

    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    written = 0
    for i, row in enumerate(rows, 1):
        body = template
        for key, val in row.items():
            body = body.replace("{" + key + "}", (val or "").strip())
        # Leftover unfilled placeholders are flagged so you don't send blanks.
        flagged = "[CHECK]" if "{" in body and "}" in body else ""
        label = (row.get("company") or row.get("name") or f"prospect_{i}").strip()
        safe = "".join(c if c.isalnum() else "_" for c in label)[:40]
        path = os.path.join(out_dir, f"{i:02d}_{safe}.txt")
        with open(path, "w", encoding="utf-8") as out:
            out.write(body)
        written += 1
        if flagged:
            print(f"  {flagged} unfilled placeholder in {path}")

    print(f"Wrote {written} personalized drafts to {out_dir}/")
    print("Next: review each, then send (paste into Gmail or use the Gmail draft tool).")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python tools/outreach_drafter.py prospects.csv template.txt out_dir/")
        sys.exit(1)
    draft(sys.argv[1], sys.argv[2], sys.argv[3])
