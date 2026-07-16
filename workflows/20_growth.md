# Workflow 20 — Growth (from zero audience)

**Objective:** Take a newsletter from 0 subscribers to a monetizable list, honestly and
without paid ads as the primary engine. Growth is continuous, not a phase you finish.

**Owner:** Growth agent, coordinated by the Managing Editor.

**Reality check:** From zero, growth is the hardest part and the slowest. This workflow
optimizes for compounding, owned channels rather than one-off spikes. No bought lists,
no fake subscriber counts — those poison deliverability and trust.

---

## Step 1 — Lead magnet  · creates a reason to subscribe

1. Identify the single most valuable "quick win" asset for the niche avatar
   (a curated database, a template, a checklist, a mini-report).
2. Produce it through the **issue-production pipeline** (workflow 10) so it is fully
   fact-verified — a lead magnet with a wrong fact costs trust at the worst moment.
3. Host it behind the signup: `tools/render_page.py` builds the landing + delivery page.

**Output:** live lead magnet + landing page URL.

---

## Step 2 — Owned SEO surface  · compounding discovery

1. Every issue is posted to a public web archive (`tools/publish_web_archive.py`).
2. Optimize archive pages for search: clear titles, the question the issue answers,
   internal links between related issues.
3. This turns each issue into an evergreen discovery asset — the main free acquisition
   channel for a zero-audience start.

---

## Step 3 — Community & social distribution  · manual-fit, honest

1. Map where the avatar already gathers (subreddits, forums, LinkedIn/X communities,
   Slack/Discord groups, niche aggregators).
2. Contribute genuinely useful answers there; link to the relevant archive issue only
   when it truly helps. No spam, honor each community's self-promo rules.
3. `tools/social_post.py` schedules teasers of each new issue.

---

## Step 4 — Referral loop  · readers invite readers

1. Add a referral mechanism via the ESP (`tools/esp_admin.py`): subscribers get a
   unique link; milestones unlock a reward (a premium asset — not cash).
2. Add a one-line "forward this to a colleague" ask to each issue.

---

## Step 5 — Deliverability & list hygiene  · protects everything

1. Authenticate the sending domain (SPF, DKIM, DMARC) at setup — `tools/esp_admin.py`
   documents the required DNS records.
2. Monitor bounce/complaint rates; auto-suppress hard bounces.
3. Run a re-engagement sequence for inactives; sunset those who never re-engage. A
   smaller engaged list out-earns a big dead one and keeps you out of spam folders.

---

## Metrics that matter (feed Phase 4)

- Net new subscribers / week and by source
- Landing-page conversion rate
- Archive traffic → signup rate
- Referral participation rate
- List engagement (open/click) and deliverability (bounce/complaint)

**Honesty note:** report real numbers, including when growth is slow. Slow-but-real
compounds; vanity metrics don't pay.
