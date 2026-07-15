#!/usr/bin/env python3
"""
find_grants.py  --  The "finding" half of a grant/bid-writing service.

Queries the public Grants.gov Search2 API for open funding opportunities,
scores them against a client's profile (keywords + who they are), and prints
a ranked shortlist with close dates and links -- the raw material you turn
into a proposal.

The Grants.gov Search2 endpoint is public and needs NO API key.
    POST https://api.grants.gov/v1/api/search2

NOTE: run this from your own machine / a normal network. Some sandboxed
environments block outbound calls to api.grants.gov; use --demo there to see
exactly what the output looks like on real-shaped data.

USAGE
-----
    # Live search for an after-school youth nonprofit:
    python3 tools/find_grants.py --keyword "after school youth" \\
        --eligibility nonprofit --rows 25

    # See the output format with no network (bundled sample):
    python3 tools/find_grants.py --demo --keyword "youth"

    # Save a client profile once, reuse it:
    python3 tools/find_grants.py --save-profile clients/boys_club.json \\
        --keyword "youth mentoring after school" --eligibility nonprofit
    python3 tools/find_grants.py --profile clients/boys_club.json
"""

import argparse
import json
import sys
import urllib.request
import urllib.error
from datetime import date, datetime

API_URL = "https://api.grants.gov/v1/api/search2"

# Grants.gov eligibility codes (common ones). Full list in their API docs.
ELIGIBILITY = {
    "nonprofit": "12",       # Nonprofits w/o 501(c)(3) status other than IHE
    "nonprofit501": "25",    # Nonprofits with 501(c)(3)
    "smallbusiness": "05",   # For-profit small business
    "forprofit": "06",       # For-profit (other than small business)
    "individual": "21",      # Individuals
    "city": "01",            # City or township governments
    "county": "02",          # County governments
    "state": "00",           # State governments
    "tribal": "07",          # Federally recognized tribal governments
}

# A tiny, realistically-shaped sample of the Grants.gov response, for --demo.
DEMO_HITS = [
    {"number": "ED-GRANTS-2026-21CCLC", "title": "21st Century Community Learning Centers",
     "agency": "Department of Education", "oppStatus": "posted",
     "openDate": "05/01/2026", "closeDate": "09/30/2026", "id": "358001"},
    {"number": "OJJDP-2026-YMENT", "title": "Youth Mentoring Program Support",
     "agency": "Office of Juvenile Justice and Delinquency Prevention", "oppStatus": "posted",
     "openDate": "06/15/2026", "closeDate": "08/20/2026", "id": "358114"},
    {"number": "ACF-FYSB-2026-RHY", "title": "Runaway and Homeless Youth Basic Center Program",
     "agency": "Administration for Children and Families", "oppStatus": "posted",
     "openDate": "06/01/2026", "closeDate": "10/15/2026", "id": "358210"},
    {"number": "NEA-2026-ARTSED", "title": "Arts Education for Underserved Communities",
     "agency": "National Endowment for the Arts", "oppStatus": "posted",
     "openDate": "07/01/2026", "closeDate": "07/25/2026", "id": "358330"},
    {"number": "USDA-2026-RURDEV", "title": "Rural Business Development Grant",
     "agency": "Department of Agriculture", "oppStatus": "posted",
     "openDate": "04/10/2026", "closeDate": "12/01/2026", "id": "358401"},
]


def parse_date(s):
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def query_live(keyword, elig_code, rows):
    payload = {"rows": rows, "keyword": keyword or "", "oppStatuses": "posted"}
    if elig_code:
        payload["eligibilities"] = elig_code
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        API_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    return data.get("data", {}).get("oppHits", [])


def score(hit, keywords, today):
    """Higher = more worth pursuing. Rewards keyword match + closing-soon (but not past)."""
    title = (hit.get("title") or "").lower()
    kw_hits = sum(1 for k in keywords if k and k.lower() in title)
    s = kw_hits * 10

    close = parse_date(hit.get("closeDate"))
    if close:
        days = (close - today).days
        if days < 0:
            s -= 100                      # already closed -> sink it
        elif days <= 21:
            s += 6                        # urgent, real, actionable
        elif days <= 60:
            s += 4
        else:
            s += 1
    return s, (close, kw_hits)


def days_left(hit, today):
    close = parse_date(hit.get("closeDate"))
    if not close:
        return "  n/a"
    d = (close - today).days
    return f"{d:>4}d" if d >= 0 else "CLOSED"


def print_shortlist(hits, keywords, today):
    scored = sorted(
        ((score(h, keywords, today)[0], h) for h in hits),
        key=lambda x: x[0], reverse=True)
    live = [(s, h) for s, h in scored if s > -50]

    line = "-" * 74
    print(line)
    print(f"  OPEN GRANT SHORTLIST   ({len(live)} live matches, ranked)")
    print(f"  keywords: {', '.join(keywords) or '(none)'}   as of {today.isoformat()}")
    print(line)
    if not live:
        print("  No open matches. Try broader keywords or drop --eligibility.")
        print(line)
        return
    for rank, (s, h) in enumerate(live, 1):
        print(f"  #{rank}  [{days_left(h, today)} left]  score {s}")
        print(f"      {(h.get('title') or '').strip()[:64]}")
        print(f"      {h.get('agency','?')}  ·  {h.get('number','?')}  ·  closes {h.get('closeDate','?')}")
        print(f"      https://grants.gov/search-results-detail/{h.get('id','')}")
        print()
    print(line)
    print("  NEXT: pick the top 1-3 and hand them to Claude with the client's")
    print("  info to draft proposals (see workflows/grant_bid_writing.md).")
    print(line)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Find open grants and rank them for a client.")
    ap.add_argument("--keyword", help="Search + scoring keywords, e.g. \"after school youth\"")
    ap.add_argument("--eligibility", choices=sorted(ELIGIBILITY),
                    help="Filter by who the client is")
    ap.add_argument("--rows", type=int, default=25, help="Max results to pull (default 25)")
    ap.add_argument("--demo", action="store_true", help="Use bundled sample data (no network)")
    ap.add_argument("--profile", help="Load a saved client profile JSON")
    ap.add_argument("--save-profile", help="Save current keyword/eligibility to a profile and exit")
    ap.add_argument("--today", help="Override today's date (YYYY-MM-DD) for testing")
    args = ap.parse_args(argv)

    kw, elig = args.keyword, args.eligibility
    if args.profile:
        with open(args.profile) as f:
            p = json.load(f)
        kw = kw or p.get("keyword")
        elig = elig or p.get("eligibility")

    if args.save_profile:
        with open(args.save_profile, "w") as f:
            json.dump({"keyword": kw, "eligibility": elig}, f, indent=2)
        print(f"Saved client profile to {args.save_profile}")
        return 0

    today = parse_date(args.today) if args.today else date.today()
    keywords = [w for w in (kw or "").split() if len(w) > 2]
    elig_code = ELIGIBILITY.get(elig) if elig else None

    if args.demo:
        hits = DEMO_HITS
    else:
        try:
            hits = query_live(kw, elig_code, args.rows)
        except urllib.error.URLError as e:
            print(f"Could not reach Grants.gov ({e.reason}).", file=sys.stderr)
            print("If you're in a restricted network, run with --demo to see the format.",
                  file=sys.stderr)
            return 2

    print_shortlist(hits, keywords, today)
    return 0


if __name__ == "__main__":
    sys.exit(main())
