# Growlocal — Internal Training Document

**Audience:** Growlocal team members (sales, support, onboarding)
**Live site:** https://growlocal-delta.vercel.app
**Last verified:** against production, live on the internet, on the date this doc was written
**Source of truth:** this document is generated from the actual scoring code in `src/lib/audit.js` and `src/lib/ai-visibility.js` — not from marketing copy. If the code changes, this doc needs updating too.

---

## 1. What Growlocal actually is

Two separate products, at two very different stages of readiness. Do not blur them when talking to a customer.

| | Visibility Audit | GBP Autopilot |
|---|---|---|
| **Status** | **Live now.** Free, no signup. | **Not live.** Waitlist only. |
| **What it does** | Scores any website 0–100 on three surfaces (SEO / AEO / GEO) | Would connect to a customer's real Google Business Profile via OAuth and run an AI agent to draft posts, review replies, FAQ content |
| **What it needs to go live** | Nothing — it's shipped | A verified Google Cloud OAuth app (2–6 week Google review) + `ANTHROPIC_API_KEY` |
| **Where in the code** | `src/lib/audit.js`, `src/lib/ai-visibility.js` | `src/app/api/oauth/google/*`, `src/lib/agent.js` |

**If a customer asks "can you manage my Google Business Profile today" — the honest answer is no, not yet.** The `/autopilot` page shows a waitlist form, not a working connect button, because `GOOGLE_OAUTH_CLIENT_ID` is unset in production. Selling this as live today is the single fastest way to create an angry customer. See §4 for exactly what this means for the word "GBP" in our own marketing.

---

## 2. How the audit actually works — the honest technical picture

1. Customer pastes a URL (or HTML, or plain text — three input modes, see §6).
2. Our server fetches that page's HTML directly — the same way Google's crawler would.
3. If the site blocks us (Cloudflare, etc.), we retry through a reader proxy automatically. If that also fails, we ask the customer to paste the HTML themselves (View Source → Ctrl+A → paste). This is a last resort, not the normal path.
4. We parse the HTML with regex and JSON-LD extraction — **there is no AI model involved in scoring.** Every check is a deterministic rule: does this tag exist, is this schema type present, does this string match a pattern. This matters: **the same URL will always produce the same score**, and every result can be manually re-derived by reading the code.
5. We total points per category, divide into a 0–100 score, and pick the 5 highest-value unfixed checks as "priorities."

**Why this matters for training:** when a customer says "your tool is wrong," the first question to ask is *which specific check* they disagree with — not "let me re-run it." Re-running produces the identical result, because nothing here is probabilistic.

---

## 3. Exact scoring breakdown — what each 100 points is made of

This is the table to memorize. If you can't explain why a site scored what it scored, open the report and match each failing line to this table.

### SEO — 100 points (`auditSEO` in `src/lib/audit.js`)

| Check | Points | What it actually tests |
|---|---:|---|
| Title tag length | 12 | `<title>` present, 30–60 characters |
| Meta description length | 10 | `<meta name="description">` present, 50–160 characters |
| Exactly one H1 | 12 | Exactly one `<h1>` on the page |
| Heading hierarchy | 6 | At least 2 `<h2>` subheadings |
| Canonical URL | 8 | `<link rel="canonical">` present |
| Mobile viewport | 8 | `<meta name="viewport">` present |
| HTTPS | 8 | URL starts with `https://` |
| Language attribute | 5 | `<html lang="...">` set |
| Open Graph tags | 10 | og:title, og:description, og:image all present (partial credit per tag) |
| Image alt text | 10 | ≥90% of `<img>` tags have alt text (5/10 given if the page has zero images) |
| Structured data present | 11 | At least one valid JSON-LD block exists (any type) |

### AEO — 100 points (`auditAEO` — this is what gets a business cited by ChatGPT/Perplexity/AI Overviews)

| Check | Points | What it actually tests |
|---|---:|---|
| FAQPage schema | 22 | A `FAQPage` JSON-LD block exists |
| Question-format headings | 18 | ≥5 H2–H4 headings start with how/what/why/etc. or end in `?` (partial credit at 2–4) |
| Direct-answer opening | 14 | One of the first 5 paragraphs matches the pattern "X is/are/means Y" |
| Extractable paragraphs | 12 | ≥40% of paragraphs are 40–320 characters long |
| Author attribution | 12 | Schema `author`/`creator`, or `<meta name="author">`, or `rel="author"` |
| Article/WebPage schema | 10 | Article, BlogPosting, NewsArticle, or WebPage JSON-LD present |
| HowTo schema | 6 | `HowTo` JSON-LD present |
| BreadcrumbList schema | 6 | `BreadcrumbList` JSON-LD present |

### GEO — 100 points (`auditGEO` — **read §4 before explaining this one to a customer**)

| Check | Points | What it actually tests |
|---|---:|---|
| LocalBusiness-type schema | 24 | A schema block whose `@type` is LocalBusiness or one of ~21 vertical subtypes (Restaurant, Dentist, Hotel, etc.) |
| Structured address | 14 | That schema block has an `address` object |
| Geo coordinates | 12 | That schema block has a `geo` object (lat/long) |
| areaServed | 10 | That schema block has `areaServed` |
| Opening hours in schema | 10 | `openingHoursSpecification` or `openingHours` present |
| Tap-to-call link | 12 | An `<a href="tel:...">` exists anywhere on the page |
| Telephone in schema | 6 | `telephone` field present in the LocalBusiness block |
| Map embed/link | 6 | A Google Maps or OpenStreetMap URL appears anywhere in the HTML |
| Location language in copy | 6 | The visible text contains phrases like "near me," "serving X," "located in X" |

**Overall score = average of the three category scores, rounded.** Grade bands: A ≥85, B ≥70, C ≥55, D ≥40, F below 40.

---

## 4. THE MOST IMPORTANT SECTION — does this check GBP?

**Short answer: no, not directly. Say this correctly or we will over-promise.**

The GEO category checks whether a **website** contains the structured data (LocalBusiness schema, address, phone, hours) that a well-optimized local business *should* have. This is genuinely useful — Google and AI systems read exactly these signals — but it is **not the same thing as reading a customer's actual Google Business Profile listing.**

Concretely, our tool:

- ✅ Does check: is there a `tel:` link on the page
- ✅ Does check: does the website's JSON-LD declare the business's address, hours, and coordinates
- ✅ Does check: does the page mention nearby locality names
- ❌ Does **not** check: the customer's actual GBP review count or rating
- ❌ Does **not** check: whether their GBP profile is even claimed or verified
- ❌ Does **not** check: their GBP post frequency, photo count, or Q&A activity
- ❌ Does **not** check: NAP consistency between the website and the *actual* live GBP listing (we can only see the website's side of that comparison)
- ❌ Does **not** connect to Google's Business Profile API at all today

**The product that would do the second list is GBP Autopilot — and it is not live.** It requires the customer to grant OAuth access to their real profile (see §1), which we cannot request today because Google hasn't verified our app yet.

### How to phrase this to a customer

**Wrong:** *"We'll check your Google Business Profile."*
**Right:** *"We'll check whether your website has the technical signals that support a strong Google Business Profile — structured address, phone, hours, and local content. For managing the actual profile — posts, review replies — that's our Autopilot product, currently in early access; join the waitlist and we'll notify you."*

If a customer specifically asks "does this look at my actual GBP listing, ratings, or reviews" — the answer is **no**, and you should say so plainly rather than let them assume otherwise from the word "GBP" appearing in our branding.

---

## 5. Is Growlocal's own website SEO/AEO/GEO optimized?

**Yes — verified, not assumed.** We ran our own tool against our own live production site. This is reproducible by anyone on the team in under a minute (see §7 for the exact command).

```
Growlocal audits itself, live in production:
  Overall: 98/100  Grade A
  SEO:     95/100
  AEO:    100/100
  GEO:    100/100
```

What makes that true, concretely:
- Homepage opens with a direct definitional sentence ("Growlocal is a free website audit tool that...")
- FAQPage schema on the homepage and every blog post, with visible matching FAQ content
- Organization + ProfessionalService schema with real address, phone, geo coordinates, opening hours
- A `tel:` link in the footer, plus a Google Maps link
- Section headings phrased as questions throughout the homepage and blog
- We also self-check with the AI Visibility tool: **100/100, all 7 major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) explicitly allowed in robots.txt**

The 2 SEO points we don't have are structural, not oversights: the homepage has no `<img>` tags by design (illustration-free), which caps the image-alt-text check's partial credit at 5/10 instead of 10/10.

**Do not claim 100/100 across the board** — 95/95/100/100 rounds to 98, and that's the honest number. If a customer or prospect asks, show them the real number, not a rounded-up claim.

---

## 6. The three input modes — know when to recommend which

| Mode | When to use it | What it can and can't score |
|---|---|---|
| **URL** | Default. Use for 95% of customers. | Full SEO + AEO + GEO |
| **HTML** (paste page source) | When URL mode fails — usually a site behind Cloudflare/Akamai/etc. that also defeats our reader-proxy fallback | Full SEO + AEO + GEO, identical to URL mode |
| **Text** (paste plain copy) | When a customer only has draft copy, not a live page — e.g. reviewing content before it's built | **AEO only.** SEO and GEO are explicitly listed as "not assessed" in the result — we do not fake those two scores from text alone |

If a customer pastes plain text and asks "why didn't I get an SEO score" — this is intentional, not a bug. Explain: schema, meta tags, and canonical URLs don't exist in plain text, so there's nothing to check.

---

## 7. How to verify a result is correct — the actual verification procedure

Every score we produce is independently checkable with free, official tools. Use this when a customer disputes a result, or when onboarding new team members so they trust the tool.

### Step-by-step manual verification

1. **Pick the specific failing/passing check you want to verify** (e.g., "No FAQPage schema").
2. **View source** of the audited page: `Ctrl+U` in Chrome, or `curl -s <url> | less`.
3. **For any schema claim** — search the HTML for `application/ld+json`. Copy every block you find into **[Google's Rich Results Test](https://search.google.com/test/rich-results)**. This is Google's own official validator — if it agrees with us, the schema check is correct by definition, because we're reading the exact same JSON-LD Google reads.
4. **For any meta/title/heading claim** — these are directly visible in View Source. Count the characters yourself if you doubt a length check.
5. **For the AI Visibility tool specifically** — fetch `<site>/robots.txt` directly in a browser and read it. Our tool quotes the exact rule it matched against (e.g., `"Blocked by 'disallow: /' in a rule naming this crawler"`) — that quote should be verbatim in the file.
6. **For a "site couldn't be fetched" result** — try `curl -I <url>` yourself. If it also fails or times out, our result is accurate, not a bug on our end.

### Reproducing the self-audit (§5) yourself

```bash
curl -s -X POST https://growlocal-delta.vercel.app/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url":"https://growlocal-delta.vercel.app"}'
```

This is the actual production API — the same one the website calls. If you run this and get a materially different score than 98, something has changed and this document is out of date; flag it.

### What "correct" means for this tool — and its limits

Because every check is a deterministic rule against the HTML, "is this result correct" really means "did our regex/parser correctly detect what's actually in the page." Known edge cases:

- **JavaScript-rendered content.** We fetch raw HTML — we do **not** run a headless browser. A site built entirely in client-side JavaScript (a bare React app with no server rendering) may show a near-empty `<body>` to us even though a real visitor sees a full page. This is a real limitation, not a scoring bug — flag it to a customer if their SEO score looks implausibly low for a site that "looks fine" in a browser.
- **Malformed JSON-LD.** If a site's schema has a syntax error, we silently skip that block rather than crash (see the `catch` in `parseJsonLd`). The customer's schema might exist but still score as "missing" if it doesn't parse — worth checking in Rich Results Test, which will show the same parse error.
- **The reader-proxy fallback** (used when a site blocks us directly) has been spot-verified to return byte-identical HTML for the signals we check, but it is a third-party service (`r.jina.ai`) outside our control. If a proxied result looks wrong, re-run in HTML paste mode to rule out the proxy.

---

## 8. The three free tools — quick reference for demos

| Tool | URL | What it proves in a demo |
|---|---|---|
| **AI Visibility** | `/tools/ai-visibility` | Pull up a news site (many block AI crawlers) to show a 0/100 with named crawlers blocked — then run our own site for 100/100 as contrast |
| **Schema Generator** | `/tools/schema-generator` | 100% client-side — nothing typed is sent anywhere. Good for privacy-conscious customers. Generates paste-ready LocalBusiness + FAQPage JSON-LD |
| **Competitor Compare** | `/tools/compare` | Runs two audits in parallel and shows only the checks the *competitor* passes that the customer doesn't — this is the most persuasive tool for a sales conversation because it's phrased as a gap to close, not just a score to feel bad about |

---

## 9. What's NOT built yet — say this proactively, don't wait to be asked

| Feature | Status |
|---|---|
| GBP Autopilot (real OAuth connection, AI-drafted posts/replies) | Waitlist only — Google hasn't verified our OAuth app |
| Real AI-generated content in Autopilot actions | Falls back to labelled stub text without `ANTHROPIC_API_KEY` set |
| Waitlist/comment persistence | Currently logs to server console; degrades to "email us to confirm" without a KV database attached |
| User accounts / login | Magic-link auth exists in code but has no purpose yet since Autopilot isn't live |
| Payment / subscriptions | Not built |

---

## 10. One-line answers for common questions

- **"Is the website AEO/SEO/GEO optimized?"** — Yes, verified: 98/100 on our own audit tool, 100/100 on our own AI-visibility check. Reproducible by anyone with the curl command in §7.
- **"Does the audit cover GBP?"** — It checks the website-side signals that support a good GBP (schema, NAP, hours). It does not read a customer's actual live GBP listing. That requires Autopilot, which is not live.
- **"How do I know a result is correct?"** — Every check is a deterministic rule against public HTML/schema. Cross-check any schema claim in Google's Rich Results Test; cross-check any robots.txt claim by opening the file directly. See §7.
- **"Why did text-paste mode not give me an SEO score?"** — By design. Plain text has no meta tags or schema to check.
- **"Can we sign a customer up for GBP management today?"** — No. It's a waitlist. Be upfront about this.
