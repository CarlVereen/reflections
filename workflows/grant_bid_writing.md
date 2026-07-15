# Workflow: Grant & Bid Writing Service

**Primary niche: churches & faith-based community orgs** (Carl already has warm
relationships here — that's the moat). The same playbook extends to any small
nonprofit or contractor later.

**The product.** We find open grants / RFPs for a client and write the proposals.
The client is a church, faith-based community center, small nonprofit, or small
business that leaves real money on the table because *finding funding and writing
applications is miserable and they have no time for it.*

**The tool.** `tools/grant_pipeline.py` does search → classify (who it's for,
eligibility, faith-based fit, deadline, how to apply) → drafts a personalized
outreach email. Run `--demo` to preview; run live from a normal network.

### Faith-based orgs & grants — what to know
- Churches are **automatically tax-exempt** (no IRS filing needed), BUT many
  grants want an **EIN and/or a 501(c)(3) determination letter**. If a church
  lacks the letter, a separate nonprofit arm (a "community center" or
  "outreach ministry" 501(c)(3)) is often the cleaner applicant.
- Faith-based orgs **are eligible** for most federal/foundation community grants
  under long-standing faith-based-initiative rules — **but the funds must support
  the secular service** (food pantry, after-school, housing, addiction recovery),
  **not worship or proselytizing.** Frame every proposal around the community
  outcome, not the ministry.
- Best-fit funders for churches: community foundations, denominational grant
  programs, USDA/ACF/OJJDP community services, and local/city ARPA-style funds.

**Why this is differentiated (not another crowded website/content shop):**
- The raw material is **public data** (Grants.gov, SAM.gov, state & foundation
  portals) that almost no small org systematically mines.
- The work is **tedious and specialized** — high barrier, so competition is thin.
- The **ROI is obvious**: one $50k grant win pays our fee 10× over, which makes
  it one of the easiest services on earth to sell.
- It gets more defensible the narrower we go — owning "after-school youth
  nonprofits in [region]" or "small paving contractors chasing municipal bids"
  is a moat, because the funder landscape and language are learned, not googled.

**The split.**
- **Claude fulfills** — I run the finder, read the funder's requirements, and
  draft the full proposal in the funder's required structure and voice. I also
  write cover letters, budget narratives, and boilerplate the client reuses.
- **You (the human) sell & manage** — you find clients, own the relationship,
  gather their real info, and submit. You are the business of record.

---

## Pricing (grounded in 2026 market rates)

Grant writers charge **$40–150/hr, $1,000–8,000 per proposal, or $2,000–6,000/mo
retainer** (giddingsconsulting.com, nonprofitgrantwriters.com, 2026). Start here:

| Package | What's included | Price |
|---|---|---|
| **Opportunity scan** | Pipeline run + ranked shortlist of grants they qualify for, with deadlines | **Free** (the hook) |
| **Single application** (church-friendly) | One full application, funder-formatted, 1 revision. Low upfront + rest on delivery | **$300–750** |
| **Standard proposal** | Larger foundation/federal proposal, more complex | **$1,200–3,500** |
| **Retainer** | Ongoing scanning + 1–2 proposals/mo + reusable boilerplate library | **$1,500–3,000/mo** |

> **CRITICAL — THE FEE MODEL (this protects you AND the church).**
> We do **NOT** take a percentage of the award or an "only-pay-if-you-win"
> contingency fee. Reasons:
> - The **Grant Professionals Association code of ethics prohibits** contingency
>   / percentage-of-award fees.
> - **Many funders — especially federal — forbid it**, and applications often
>   make the org *certify* no contingency fee was paid. A contingency deal can
>   **disqualify the church** or make grant costs unallowable.
>
> Instead we keep the church's risk low the compliant way: **free scan + a small
> flat fee for the writing** (low deposit, balance on delivery, or a payment
> plan). One win pays for many applications — but our fee is always for the
> WORK, never a slice of their grant.

---

## FULFILLMENT LOOP (my job — what to hand Claude per client)

**Step 1 — Find & classify.** Build the org profile, then run the pipeline:
```
python3 tools/grant_pipeline.py --new-profile clients/<org>.json   # then fill it in
python3 tools/grant_pipeline.py --profile clients/<org>.json
```
It returns a ranked, eligibility-checked shortlist + a draft outreach email.
(`tools/find_grants.py` is the simpler search-only version.)

**Step 2 — Give me the client's REAL facts.** For each proposal I need:
1. Legal name, 501(c)(3)/EIN or business registration, year founded, budget size
2. Mission + the specific program this grant would fund
3. The need/problem, with any local data they have (or say "help me find public stats")
4. Past outcomes / track record (real numbers only)
5. A rough budget for the funded project
6. The funder's requirements (I'll read the NOFO/RFP if you paste the link/text)

**Step 3 — I draft.** I produce a complete, funder-formatted proposal:
executive summary, statement of need, goals/objectives, outcomes, capacity,
evaluation, budget narrative, sustainability — matched to the funder's exact
criteria. See `products/grant_writing/sample_proposal.md` for the quality bar.

**Step 4 — Client reviews & submits.** They verify every fact, approve, submit.
We keep their boilerplate on file so proposal #2 takes half the time.

**Turnaround: 3–5 business days per proposal** (federal, longer). Never fabricate
data, outcomes, or credentials — the client supplies and verifies all facts.

---

## SALES LOOP (your job)

### The killer opener: lead with a free scan
You don't pitch "I'm a grant writer." You show up with **money they qualify for
and didn't know about.** Run the finder for a target org, then:

> "Hi — I help local [nonprofits/contractors] win grants and bids. I ran a quick
> scan and found [3] open opportunities your org looks eligible for, one closing
> [date] worth up to [$X]. Happy to send you the shortlist free. If you want, I
> can write the application for a flat fee — you only pay for the writing, never
> a cut of the award."

### Where the clients are
- **Nonprofits:** community foundations, United Way chapters, nonprofit
  Facebook groups, church networks, your local nonprofit resource center.
- **Contractors/small biz:** trade associations, chambers of commerce, minority-/
  veteran-/woman-owned business networks (huge set-aside bid money), SBDCs.

### Close & repeat
- First client: offer the first proposal at a **discount ($750) for a
  testimonial + the right to say you helped them.** One win = a case study.
- A won grant is the best marketing that exists — winners refer other orgs.
- Convert one-off clients to **retainers** (there's always a next deadline).

**Target: 10 free scans → 2–3 paid proposals → your first ~$3,000, and one win
turns into a referral engine.**

---

## Guardrails

- **Flat/hourly/retainer fees only — never a % of the award.** (Ethics + funder rules.)
- **Never invent facts.** All programs, budgets, outcomes, and nonprofit status
  come from the client and are verified by them before submission.
- **Don't overpromise win rates.** Good writing improves odds; nobody guarantees
  a grant. Say so plainly — it builds trust.
- **You're the business of record.** Collect through your own account, keep books,
  set aside for taxes.
- **Respect each funder's rules** on formatting, page limits, and eligibility —
  a proposal that breaks the rules gets tossed unread.

---

## Outreach guardrails (cold email)

- **Warm first.** Start with the churches you already know — a personal intro
  beats any cold email. Cold outreach is phase two.
- **CAN-SPAM basics** for any cold email: be truthful in the subject, identify
  yourself, include a real physical mailing address, and honor opt-outs.
- The tool *drafts* outreach — **you review, personalize, and send.** Never
  auto-blast.

## Next action right now

1. **See it work** — `python3 tools/grant_pipeline.py --demo --profile-inline
   "Grace Chapel|Your Town|food pantry youth|nonprofit501|yes|you@email"`
2. **Pick your first church** — tell me its name, town, what community programs
   it runs (food pantry? youth? recovery?), and whether it has a 501(c)(3)
   letter. I'll produce a real, eligibility-checked opportunity shortlist and a
   tailored draft application you can bring to them.
