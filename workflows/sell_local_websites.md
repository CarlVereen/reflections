# Workflow: Local Business Website Service — "Done-for-you site in 48 hours"

**The product we sell.** A professional, fast, mobile-friendly one-page website
for a local business (landscapers, cleaners, detailers, roofers, HVAC, salons,
food trucks — any local service business with a weak or missing website).

**The split.**
- **Claude fulfills** — I build the entire site to the quality of
  `products/local_website/template.html`, customized to the client. I can also
  write their copy, headlines, service descriptions, and FAQ.
- **You (the human) sell & collect** — you find prospects, show the sample,
  collect payment, register a domain / host it, and are the human name on the
  invoice and the client relationship.

Why this works from zero: you don't pitch, you *show*. You walk up with a
finished sample of THEIR business already built. The site does the selling.

---

## The offer & pricing

| Package | What's included | Price |
|---|---|---|
| **Starter site** | 1-page site (like the demo), their copy + colors, contact form, mobile-ready, delivered ready to host | **$600 one-time** |
| **Site + setup** | Starter + domain + hosting set up + Google Business Profile linked | **$900 one-time** |
| **Care plan** (recurring) | Hosting, edits, seasonal updates, 1 content refresh/mo | **$79/month** |

Start at these numbers. Market rate for a freelancer one-pager is **$500–3,000**
(leadpages.com, gruffygoat.com, 2026), so $600 is an easy yes and still real money.
Raise prices once you have 3–4 testimonials.

**The math to survive-and-thrive:** 1 site/week at $600 = ~$2,400/mo. Convert
half to $79 care plans and after a year that's ~$1,000+/mo recurring on top —
the recurring is what keeps the lights on between sales.

---

## FULFILLMENT LOOP (my job — what to hand Claude per client)

Give me these 6 things and I produce the finished `client.html` in one pass:

1. Business name + what they do
2. Town(s) they serve
3. Phone + email (and domain if they have one)
4. 3–5 services (with rough starting prices if they'll share)
5. 3–6 real photos (or say "use styled placeholders for now")
6. 2–3 reviews (real ones, or "pull their best Google reviews")

I then:
- Clone `products/local_website/template.html`
- Swap name, colors, copy, services, reviews, phone, hours, service area
- Write any missing copy in the business's voice
- Return a single self-contained `.html` file — no dependencies, hosts anywhere

**Turnaround: same day.** That's the promise that beats every agency.

---

## SALES LOOP (your job)

### 1. Build the free sample (costs you nothing)
Pick a local business with a bad or missing website. Send me their basics.
I build a sample with THEIR name on it in ~an hour.

### 2. Reach out — lead with the finished sample
Best channels, in order: walk in during slow hours, Facebook/Instagram DM,
then email. Copy-paste opener:

> "Hi — I'm [You], I build websites for local businesses here in [town]. I
> actually already put together a sample site for [Business] so you can see it,
> no charge and no obligation: [link]. If you like it, I can have it live on your
> own domain this week for a flat $600. Want me to send it over?"

### 3. Close
- They love it → collect payment (Stripe/Square/PayPal invoice, or deposit),
  register domain, host it, hand over the link.
- "Maybe later" → offer the $79/mo care plan so there's no upfront cost.
- No reply → the sample cost you nothing. Move to the next one.

### 4. Bank the proof
Screenshot their reaction / get a one-line testimonial + the result.
3 testimonials = you raise prices and referrals start.

**Target: 10 samples out → 2–3 closes.** That's your first ~$1,500 and proof the
machine works.

---

## Hosting & handoff (keep it dead simple)

The deliverable is ONE `.html` file — no build step, no database. Host options,
cheapest first:
- **Netlify Drop / Cloudflare Pages** — drag the file in, free tier, live in minutes
- **GitHub Pages** — free (you already know Git!)
- Client's existing domain → point it at the host

Domain via Namecheap/Cloudflare (~$10–15/yr) — bill it inside the "Site + setup"
package so you never pay out of pocket.

---

## Guardrails

- **Never publish a site impersonating a business without their OK.** Samples are
  clearly marked "sample/demo" until they pay and approve (the template has a
  demo ribbon at the top — I remove it only for a paying, approving client).
- **Use real photos and real reviews** once they're a client — no fake claims.
- **You're the business of record.** Collect payment through your own account,
  keep simple books, set aside for taxes.
- **Under-promise turnaround, over-deliver.** Say "this week," deliver same day.

---

## Next action right now

Pick ONE real local business near you with a weak/no website. Send me:
name, town, phone, and what they do. I'll build the free sample today — that's
the first domino.
