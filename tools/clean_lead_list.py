#!/usr/bin/env python3
"""
clean_lead_list.py — Deduplicate, normalize, and validate a CSV of leads/contacts.

This is a sellable deliverable on its own: businesses constantly have messy
spreadsheets of leads. Hand them back a clean one and you've earned $50-150.

Usage:
    python tools/clean_lead_list.py input.csv output.csv

What it does:
    - Trims whitespace and normalizes casing (names Title Case, emails lowercase)
    - Standardizes US phone numbers to (XXX) XXX-XXXX
    - Flags invalid / missing emails
    - Removes exact + email-based duplicates (keeps the most complete row)
    - Writes a clean CSV + prints a summary report

No external dependencies. Runs with plain Python 3.
"""
import csv
import re
import sys
from collections import OrderedDict

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:]}"
    return (raw or "").strip()


def title_case(raw: str) -> str:
    return " ".join(w.capitalize() for w in (raw or "").split())


def completeness(row: dict) -> int:
    return sum(1 for v in row.values() if (v or "").strip())


def clean(in_path: str, out_path: str) -> None:
    with open(in_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        print("No rows found in input.")
        return

    fields = list(rows[0].keys())
    # Detect likely columns
    def find(*names):
        for fld in fields:
            if fld.lower().strip() in names:
                return fld
        return None

    name_col = find("name", "full name", "contact", "contact name")
    email_col = find("email", "e-mail", "email address")
    phone_col = find("phone", "phone number", "telephone", "mobile")

    cleaned = []
    invalid_email = 0
    for row in rows:
        r = {k: (v or "").strip() for k, v in row.items()}
        if name_col:
            r[name_col] = title_case(r.get(name_col, ""))
        if email_col:
            r[email_col] = r.get(email_col, "").lower()
            if r[email_col] and not EMAIL_RE.match(r[email_col]):
                invalid_email += 1
        if phone_col and r.get(phone_col):
            r[phone_col] = normalize_phone(r[phone_col])
        cleaned.append(r)

    # Dedupe: prefer email key, fall back to whole-row key. Keep most complete.
    best = OrderedDict()
    for r in cleaned:
        key = (r.get(email_col, "").lower() if email_col else "") or tuple(r.values())
        if key not in best or completeness(r) > completeness(best[key]):
            best[key] = r
    deduped = list(best.values())

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(deduped)

    removed = len(cleaned) - len(deduped)
    print("=== Lead List Cleanup Report ===")
    print(f"Input rows:        {len(rows)}")
    print(f"Duplicates removed:{removed:>4}")
    print(f"Invalid emails:    {invalid_email:>4} (flag these to the client)")
    print(f"Clean rows out:    {len(deduped)}")
    print(f"Saved to:          {out_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python tools/clean_lead_list.py input.csv output.csv")
        sys.exit(1)
    clean(sys.argv[1], sys.argv[2])
