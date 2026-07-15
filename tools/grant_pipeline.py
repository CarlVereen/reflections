#!/usr/bin/env python3
"""
grant_pipeline.py  --  Search -> classify -> outreach, for a faith-based /
community-org grant service.

Given an organization's profile, this tool:
  1. SEARCHES open funding (Grants.gov public Search2 API, no key needed)
  2. CLASSIFIES each opportunity -- who it's for, whether this org is eligible,
     whether it's faith-based friendly, the deadline, and how to apply
  3. Produces a per-opportunity BRIEF and a personalized OUTREACH email draft
     you can send to the organization

Design note (WAT framework): this tool does the deterministic, mechanical work
-- pulling data, matching eligibility codes, extracting deadlines/links, filling
the outreach template. The nuanced judgment ("is this really a fit? how do we
frame the need?") and the final proposal writing are the agent's job -- see
workflows/grant_bid_writing.md.

RUN LOCATION: run from your own machine / normal network. Sandboxes may block
api.grants.gov; use --demo anywhere to see the exact output on real-shaped data.

USAGE
-----
    # Build an org profile once:
    python3 tools/grant_pipeline.py --new-profile clients/grace_chapel.json

    # (edit that JSON with the church's real details, then:)
    python3 tools/grant_pipeline.py --profile clients/grace_chapel.json

    # See it end-to-end with no network:
    python3 tools/grant_pipeline.py --demo --profile-inline \\
        "Grace Chapel Community Center|Rivertown, OH|food pantry youth after school|nonprofit501|yes|pastor@example.org"
"""

import argparse
import json
import sys
import textwrap
import urllib.request
import urllib.error
from datetime import date, datetime

SEARCH_URL = "https://api.grants.gov/v1/api/search2"
DETAIL_URL = "https://api.grants.gov/v1/api/fetchOpportunity"

ELIGIBILITY = {
    "nonprofit": "12", "nonprofit501": "25", "smallbusiness": "05",
    "forprofit": "06", "individual": "21", "city": "01", "county": "02",
    "state": "00", "tribal": "07", "unrestricted": "99",
}
# Codes under which a faith-based nonprofit can typically apply.
FAITH_FRIENDLY_CODES = {"12", "25", "13", "99", "20"}

PROFILE_TEMPLATE = {
    "name": "",                # e.g. "Grace Chapel Community Center"
    "location": "",            # "Rivertown, OH"
    "focus_keywords": "",      # "food pantry youth after school"
    "eligibility_type": "nonprofit501",   # see ELIGIBILITY keys
    "faith_based": True,
    "has_501c3_letter": True,  # churches are auto-exempt but many grants want the letter/EIN
    "contact_email": "",
    "contact_name": "",        # "Pastor Dawes"
}

# --- Realistically-shaped demo data (search hits + detail records) ----------
DEMO_HITS = [
    {"id": "358114", "number": "OJJDP-2026-YMENT", "title": "Youth Mentoring Program Support",
     "agency": "Office of Juvenile Justice and Delinquency Prevention", "oppStatus": "posted",
     "openDate": "06/15/2026", "closeDate": "08/20/2026", "eligibilities": ["25", "12", "99"]},
    {"id": "358210", "number": "ACF-FYSB-2026-RHY", "title": "Runaway and Homeless Youth Basic Center Program",
     "agency": "Administration for Children and Families", "oppStatus": "posted",
     "openDate": "06/01/2026", "closeDate": "10/15/2026", "eligibilities": ["25", "12"]},
    {"id": "358501", "number": "USDA-2026-CFP", "title": "Community Food Projects Competitive Grant",
     "agency": "Department of Agriculture", "oppStatus": "posted",
     "openDate": "05/20/2026", "closeDate": "09/05/2026", "eligibilities": ["25", "12", "13"]},
    {"id": "358330", "number": "NEA-2026-ARTSED", "title": "Arts Education for Underserved Communities",
     "agency": "National Endowment for the Arts", "oppStatus": "posted",
     "openDate": "07/01/2026", "closeDate": "07/25/2026", "eligibilities": ["25"]},
    {"id": "358700", "number": "DOE-2026-STATEONLY", "title": "State Formula Education Block Grant",
     "agency": "Department of Education", "oppStatus": "posted",
     "openDate": "04/01/2026", "closeDate": "11/01/2026", "eligibilities": ["00"]},
]
DEMO_DETAILS = {
    "358114": {"required": ["SF-424", "Project narrative (15pg)", "Budget & justification", "Letters of support"],
               "summary": "Supports community organizations providing structured mentoring to at-risk youth ages 10-17."},
    "358210": {"required": ["SF-424", "Program narrative", "Budget narrative", "Proof of 501(c)(3)"],
               "summary": "Funds shelter and support services for runaway and homeless youth."},
    "358501": {"required": ["SF-424", "Project narrative", "Matching-funds documentation", "Budget"],
               "summary": "Supports food-security projects that help low-income communities meet their own food needs."},
    "358330": {"required": ["Application form", "Artistic narrative", "Budget"],
               "summary": "Arts education projects for underserved K-12 students."},
    "358700": {"required": ["State plan amendment"], "summary": "Formula funds distributed to state education agencies only."},
}


def parse_date(s):
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def load_profile_inline(spec):
    parts = (spec.split("|") + [""] * 6)[:6]
    name, loc, kw, elig, faith, email = [p.strip() for p in parts]
    p = dict(PROFILE_TEMPLATE)
    p.update({"name": name, "location": loc, "focus_keywords": kw,
              "eligibility_type": elig or "nonprofit501",
              "faith_based": faith.lower() in ("yes", "true", "1", "y"),
              "contact_email": email})
    return p


def search_live(keywords, elig_code, rows):
    payload = {"rows": rows, "keyword": keywords or "", "oppStatuses": "posted"}
    if elig_code:
        payload["eligibilities"] = elig_code
    body = json.dumps(payload).encode()
    req = urllib.request.Request(SEARCH_URL, data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r).get("data", {}).get("oppHits", [])


def detail_live(opp_id):
    body = json.dumps({"opportunityId": int(opp_id)}).encode()
    req = urllib.request.Request(DETAIL_URL, data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r).get("data", {})
    syn = d.get("synopsis", {}) or {}
    return {"required": [], "summary": (syn.get("synopsisDesc") or "")[:240]}


def classify(hit, profile, today):
    """Decide who it's for, whether org is eligible, faith-fit, urgency, how to apply."""
    kws = [w for w in profile["focus_keywords"].lower().split() if len(w) > 2]
    title = (hit.get("title") or "").lower()
    kw_hits = sum(1 for k in kws if k in title)

    elig_codes = set(hit.get("eligibilities") or [])
    my_code = ELIGIBILITY.get(profile["eligibility_type"])

    if not elig_codes:
        elig_status = "CHECK"          # unknown -> verify manually
    elif my_code in elig_codes:
        elig_status = "ELIGIBLE"
    elif elig_codes & {"99"}:
        elig_status = "LIKELY"         # "unrestricted / see text"
    else:
        elig_status = "NOT ELIGIBLE"

    # Faith-based orgs generally cannot use restricted gov-only/IHE-only calls.
    if profile.get("faith_based") and elig_codes and not (elig_codes & FAITH_FRIENDLY_CODES):
        faith_note = "Gov/IHE-only call — a church likely can't apply directly."
    elif profile.get("faith_based"):
        faith_note = "Faith-based org OK (funds must go to secular services)."
    else:
        faith_note = ""

    close = parse_date(hit.get("closeDate"))
    days = (close - today).days if close else None

    score = kw_hits * 10
    score += {"ELIGIBLE": 8, "LIKELY": 4, "CHECK": 1, "NOT ELIGIBLE": -100}[elig_status]
    if days is not None:
        if days < 0:
            score -= 100
        elif days <= 21:
            score += 6
        elif days <= 60:
            score += 4
    return {"elig_status": elig_status, "faith_note": faith_note, "kw_hits": kw_hits,
            "days": days, "close": hit.get("closeDate"), "score": score}


def brief(hit, cls, detail):
    link = f"https://grants.gov/search-results-detail/{hit.get('id','')}"
    dleft = ("CLOSED" if (cls["days"] is not None and cls["days"] < 0)
             else (f"{cls['days']} days" if cls["days"] is not None else "n/a"))
    lines = [
        f"  {hit.get('title','').strip()}",
        f"    Funder:      {hit.get('agency','?')}  ({hit.get('number','?')})",
        f"    Eligibility: {cls['elig_status']}" + (f"  — {cls['faith_note']}" if cls['faith_note'] else ""),
        f"    Deadline:    {cls['close']}  ({dleft} left)",
        f"    Fit score:   {cls['score']}   (keyword hits: {cls['kw_hits']})",
    ]
    if detail.get("summary"):
        lines.append(f"    About:       {detail['summary']}")
    if detail.get("required"):
        lines.append(f"    To apply:    " + "; ".join(detail["required"]))
    lines.append(f"    Link:        {link}")
    return "\n".join(lines)


def outreach_email(profile, top):
    contact = profile.get("contact_name") or "there"
    org = profile.get("name") or "your organization"
    bullets = "\n".join(
        f"   • {h.get('title')} (closes {c['close']})"
        for h, c, _ in top)
    body = f"""\
Subject: Grant money {org} may qualify for (free shortlist)

Hi {contact},

I help local churches and community groups find and apply for grant funding.
I ran a quick scan for {org} and found a few open opportunities you look
eligible for:

{bullets}

I'd be glad to send the full shortlist and, if you'd like, prepare the
applications for you. My fee is a small flat rate for the writing — never a
percentage of the grant, so it never affects your application. The scan itself
is free.

Would it help if I put together the details for the one closing soonest?

Warm regards,
[Your name]
[Phone] · [Email]

--
Note: faith-based organizations are eligible for these programs; grant funds
support the community services (food, youth, housing), not religious activities.
"""
    return textwrap.dedent(body)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Search, classify, and draft outreach for grant opportunities.")
    ap.add_argument("--profile", help="Path to an org-profile JSON")
    ap.add_argument("--profile-inline", help="name|location|keywords|eligType|faith(yes/no)|email")
    ap.add_argument("--new-profile", help="Write a blank profile template to this path and exit")
    ap.add_argument("--rows", type=int, default=25)
    ap.add_argument("--top", type=int, default=3, help="How many opportunities to feature in outreach")
    ap.add_argument("--demo", action="store_true", help="Use bundled sample data (no network)")
    ap.add_argument("--today", help="Override today's date YYYY-MM-DD (testing)")
    args = ap.parse_args(argv)

    if args.new_profile:
        with open(args.new_profile, "w") as f:
            json.dump(PROFILE_TEMPLATE, f, indent=2)
        print(f"Wrote a blank org profile to {args.new_profile} — fill it in and re-run with --profile.")
        return 0

    if args.profile_inline:
        profile = load_profile_inline(args.profile_inline)
    elif args.profile:
        with open(args.profile) as f:
            profile = {**PROFILE_TEMPLATE, **json.load(f)}
    else:
        ap.error("Provide --profile, --profile-inline, or --new-profile")

    today = parse_date(args.today) if args.today else date.today()
    elig_code = ELIGIBILITY.get(profile["eligibility_type"])

    if args.demo:
        hits = DEMO_HITS
        get_detail = lambda i: DEMO_DETAILS.get(i, {"required": [], "summary": ""})
    else:
        try:
            hits = search_live(profile["focus_keywords"], elig_code, args.rows)
        except urllib.error.URLError as e:
            print(f"Could not reach Grants.gov ({e.reason}). Use --demo to preview.", file=sys.stderr)
            return 2
        get_detail = lambda i: _safe_detail(i)

    ranked = sorted(((h, classify(h, profile, today)) for h in hits),
                    key=lambda x: x[1]["score"], reverse=True)
    ranked = [(h, c) for h, c in ranked if c["score"] > -50]

    line = "=" * 74
    print(line)
    print(f"  GRANT PIPELINE for: {profile['name']}  ({profile['location']})")
    print(f"  focus: {profile['focus_keywords']}   ·   as of {today.isoformat()}")
    print(line)
    if not ranked:
        print("  No eligible open matches. Broaden the keywords or check eligibility type.")
        return 0

    featured = []
    for h, c in ranked:
        d = get_detail(h.get("id", ""))
        print(brief(h, c, d))
        print()
        if len(featured) < args.top and c["elig_status"] in ("ELIGIBLE", "LIKELY", "CHECK"):
            featured.append((h, c, d))

    print(line)
    print("  DRAFT OUTREACH EMAIL  (review, personalize, then YOU send it)")
    print(line)
    print(outreach_email(profile, featured))
    return 0


def _safe_detail(opp_id):
    try:
        return detail_live(opp_id)
    except Exception:
        return {"required": [], "summary": ""}


if __name__ == "__main__":
    sys.exit(main())
