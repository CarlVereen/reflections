# Workflow: Grant & Bid Writing Service

**The product.** We find open grants / RFPs for a client and write the proposals.
The client is a small nonprofit, contractor, or small business that leaves real
money on the table because *finding funding and writing applications is
miserable and they have no time for it.*

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
| **Opportunity scan** | Finder run + a ranked shortlist of grants/RFPs they qualify for, with deadlines | **$250** (or free as the hook) |
| **Single proposal** | One full proposal, funder-formatted, 1 revision | **$1,200–2,500** (local/foundation) · **$3,500+** (federal) |
| **Retainer** | Ongoing scanning + 1–2 proposals/mo + reusable boilerplate library | **$1,500–3,000/mo** |

> **CRITICAL ETHICS RULE — read this.** Professional standards (Grant
> Professionals Association code) prohibit charging a **percentage of the grant
> award** or contingency "only-if-you-win" fees, and many funders forbid it
> outright. **We charge flat fees / hourly / retainer for the WORK — never a cut
> of the award.** This isn't optional; it's what separates a real practice from
> a scam, and it's a selling point with sophisticated funders.

---

## FULFILLMENT LOOP (my job — what to hand Claude per client)

**Step 1 — Find.** Run the finder for their profile:
```
python3 tools/find_grants.py --keyword "<their focus>" --eligibility <type> --rows 25
```
Hand me the shortlist (or just their focus + who they are and I'll pick).

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

## Next action right now

Two ways to start, pick one:
1. **Test the engine** — `python3 tools/find_grants.py --demo --keyword "youth"`
   to see the shortlist format, then run it live on your own machine.
2. **Line up a first client** — name a local nonprofit or contractor you could
   approach, tell me their focus, and I'll produce a real opportunity shortlist
   and a tailored sample proposal you can walk in with.
