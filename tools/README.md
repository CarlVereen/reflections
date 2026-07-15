# Tools — how to run them

All tools are **plain Python 3, no installs needed** (standard library only).
Run them from the repo root.

## grant_pipeline.py — the main engine
Search open grants → classify eligibility & fit → draft outreach.

```bash
# 1. See it work with bundled sample data (works anywhere, no internet):
python3 tools/grant_pipeline.py --demo --profile-inline \
  "Grace Chapel|Rivertown, OH|food pantry youth|nonprofit501|yes|pastor@example.org"

# 2. Make a profile for a real org, fill it in, then run LIVE:
python3 tools/grant_pipeline.py --new-profile clients/grace_chapel.json
#    (edit clients/grace_chapel.json with the church's real details)
python3 tools/grant_pipeline.py --profile clients/grace_chapel.json
```

**Live vs. demo:** live mode calls the public Grants.gov API (no key needed).
Some restricted/sandboxed networks block `api.grants.gov` — there you'll see a
"could not reach" message; use `--demo` to preview the format. On a normal home/
office network it just works.

## find_grants.py — simple search-only version
```bash
python3 tools/find_grants.py --demo --keyword "youth"          # preview
python3 tools/find_grants.py --keyword "after school" --eligibility nonprofit   # live
```

## load_profit.py — (from the earlier trucking idea; unrelated to grants)
Kept for reference. Ignore for the grant business.

---

### Eligibility types (for --eligibility / profile "eligibility_type")
`nonprofit501` · `nonprofit` · `smallbusiness` · `forprofit` · `individual` ·
`city` · `county` · `state` · `tribal` · `unrestricted`

### Client data
Real org profiles live in `clients/` — that folder is **gitignored** so client
details never get committed. Keep it that way.
