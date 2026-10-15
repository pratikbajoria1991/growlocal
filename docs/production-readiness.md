# Growlocal — production readiness & UAT plan

Written 2026-09-29. This is the honest state of the app against a real launch,
not a checklist to rubber-stamp. Status marks: ✅ done, ⚠️ partial/risky, ❌ not done.

## 1. Where it actually stands

**What's real and working today (verified by build + live API tests this session):**
- Free audit tool (SEO/AEO/GEO scoring on URL, HTML, or pasted text) — deterministic, no external dependency required.
- Proposal engine (`/api/proposals`) — resolves a Google listing, scores its GBP profile, finds competitors, audits its website, produces a prioritized issue list and a 4-week plan.
- Preview website generator — builds a facts-only site from a Google listing for businesses with no website of their own.
- Concierge console — internal client book, drafts, ledger of actions taken.
- WhatsApp send/webhook plumbing with consent gating (STOP always wins; templates/free-text refused without an opt-in or open reply window).
- Jev (TypeSafe) reply-intent classification and Jev-assisted issue prioritization in proposals, both with a verified graceful fallback to deterministic logic when Jev is unavailable.

**What's broken or unverified right now:**
- ❌ **Google Maps via Composio is disabled at the toolkit/admin level.** Every place lookup fails. This blocks lead verification, competitor discovery, and — critically — **live proposal generation**, since `buildProposal()` calls `resolvePlace()` first. Until this is fixed, the core product cannot run end-to-end, on this deployment or any other, because it depends on the same Composio account.
- ❌ **WhatsApp Business API is connected to a WABA ID Meta can't resolve** (`Object with ID '...' does not exist`). No template has been submitted or approved. No real message has been sent.
- ❌ Nothing in this repo has been deployed. Nothing has been tested against Vercel KV — all store testing so far has used the local filesystem fallback.
- ❌ No automated tests exist (no `__tests__`, no CI check running them).
- ⚠️ 79 files of uncommitted work sit in the working tree, some possibly weeks old. Nothing has been code-reviewed or committed as a coherent, revertible unit.

**Fixed this session (see git history once committed):**
- Session cookies, OAuth token encryption, and OAuth CSRF state each had a hardcoded fallback secret that would silently activate if the real env var was missing in production — a full auth-bypass / token-decryption path. All three now fail closed (throw) in production instead.
- The preview website's JSON-LD was vulnerable to script-tag breakout via a Google listing name/address containing `</script>` — stored XSS reachable by anyone who can edit or suggest an edit to a Google Business Profile. Fixed by escaping `<` before embedding.

Calling the app "production ready" today would not be honest. The plan below is what actually gets it there.

## 2. Phased plan

### Phase 0 — Unblock (you; I can't do this part)
1. Get Google Maps re-enabled in Composio, or switch to `GOOGLE_PLACES_API_KEY` directly (Google Cloud project + billing) as a more stable long-term path — Composio's toolkit has now been disabled twice without warning, which is a single point of failure for the whole product.
2. Fix the WhatsApp WABA connection in Meta Business Manager (see prior message) and submit the two templates for approval (`docs` link was `../gbp-leads/whatsapp-templates-2026-09-19.md`).
3. Decide on a Postgres/Supabase migration for `user-store.js` and `oauth-store.js` — both are currently flat-file-backed (`.data/`), which does not survive Vercel's serverless filesystem at all. This is separate from the KV store used for everything else and needs its own fix before real users sign in.

### Phase 1 — Harden (I do this)
- [x] Fail-closed secrets (session, OAuth encryption, OAuth state) — done this session.
- [x] JSON-LD XSS fix on preview pages — done this session.
- [ ] Port `user-store.js` / `oauth-store.js` off the local filesystem onto the same KV store (or Postgres) — required before any deploy, since Vercel's filesystem is ephemeral and multi-instance; two serverless invocations currently would not even see each other's users.
- [ ] Add a startup/build-time check that refuses to build for `NODE_ENV=production` if `SESSION_SECRET`, `OAUTH_TOKEN_ENCRYPTION_KEY`, `OAUTH_STATE_SECRET`, or `CONCIERGE_API_TOKEN` are missing or under 32 chars, rather than discovering it at first request.
- [ ] Structured error logging (today it's scattered `console.error`) with a real sink — Vercel's own log drain, or Sentry — so a production incident is discoverable, not just guessed at.
- [ ] Cost caps: `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`, and `TYPESAFE_API_KEY` calls are all rate-limited per-IP already, but nothing caps *total daily spend* if the rate limiter is bypassed (e.g., via the admin/token path, which is unlimited by design). Add a daily spend ceiling with an alert, at minimum on the token-gated bulk endpoints.
- [ ] Legal: `/privacy` and `/terms` exist — read them against what the app actually now does (WhatsApp messaging, Jev processing of replies, storing OAuth tokens) and update if they were written before those existed.

### Phase 2 — UAT (multiple rounds, as asked)

Real UAT needs a working deployment first (Phase 0 blocks this). Once unblocked:

**Round 1 — Solo smoke test (you, on Vercel preview URL, ~30 min)**
- [ ] Free audit tool: run it against 3 real URLs (a good site, a broken site, a site with no HTTPS) — scores should differ sensibly.
- [ ] Sign in via magic link end-to-end (this is the first real test of the KV-backed user store).
- [ ] Generate one proposal from a real Kolkata business Maps link — confirm it doesn't error, confirm every number in it is traceable to something real.
- [ ] Create one preview website via the token-gated API, open it, confirm the disclaimer banner, "claim"/"remove" links, and that view-source shows no unescaped listing data.
- [ ] Mobile check: audit tool and one preview site on an actual phone, not just a resized browser.

**Round 2 — Guided test with 3–5 real Wave 1 businesses (you, ~half day)**
- [ ] Send 3–5 real leads their actual proposal link and preview link (with their consent — tell them it's a test).
- [ ] Watch what breaks: slow load, confusing copy, wrong phone number sourced from Google, a category that reads wrong.
- [ ] Test the WhatsApp reply flow with your own number pretending to be a lead — send "stop", send a question, send "haan bhejo" — confirm Jev classifies correctly and the right thing (or nothing) happens.
- [ ] Test the concierge console under real load: add a client, generate content with Gemini, approve/reject an owner decision.

**Round 3 — Adversarial pass (me, before you send this to anyone else)**
- [ ] Try to break the audit tool with malformed HTML, huge payloads, non-UTF8 input.
- [ ] Try to abuse the free proposal endpoint past its 3/hour limit from one IP, and via a spoofed `X-Forwarded-For`.
- [ ] Confirm a non-admin session can't reach `/concierge`, `/api/concierge/*`, `/api/proposals` (token-gated paths), or another user's data by guessing an ID.
- [ ] Re-run the security review once the Phase 1 items land, specifically re-checking the migrated user/OAuth store for the same class of issue.

**Round 4 — Limited launch (first 20 real Wave 1 sends, not all 116 at once)**
- [ ] Send day 1's batch only. Watch reply classification, watch for anything Jev gets wrong, watch WhatsApp for any policy warning from Meta.
- [ ] Only proceed to day 2 once day 1 shows no surprises.

## 3. What "world class" should mean here, concretely

Not more features — the audit/proposal/preview engine is already more rigorous than
most agencies' manual process (every claim traces to a measured number, "not yet
measured" is stated rather than guessed). World-class for this product means:
1. **It never sends a number it can't defend.** Already the design intent — keep enforcing it as new AI-assisted features (Jev ranking) get added; the fallback-to-deterministic pattern used for issue ranking should be the template for every future AI feature, not the exception.
2. **It fails safely, loudly, and cheaply when a dependency breaks** — Google Maps going down should degrade to "verification pending," not silently corrupt scores or crash a proposal generation for a real prospect.
3. **Nothing about a business's data sits somewhere ephemeral.** This is the Phase 1 filesystem-store item — today a real signed-up user's data can vanish on the next deploy.
4. **Compliance is load-bearing, not decorative** — WhatsApp opt-in, DPDP Act handling of Kolkata leads' personal data, and the preview site's noindex/disclaimer are already built this way; keep that bar for anything new.

## 4. Immediate next actions
1. You: unblock Composio (or switch to direct Google Places API key) and fix the WhatsApp WABA — nothing past this point is testable without both.
2. Me, once unblocked: migrate `user-store.js`/`oauth-store.js` to KV, add the production secret guard, then run Round 1 UAT myself against the Vercel preview before handing it to you for Round 2.
3. You: decide Postgres vs. staying on KV for user data long-term — KV is fine at this scale but isn't built for relational queries if Zoho CRM sync or reporting grows.

## 5. Full stack inventory for a "world class" production launch

Grounded in what's actually in `package.json` and referenced via `process.env` today (checked 2026-10-01), not a generic checklist. Grouped by whether the gap blocks launch, is needed to call it world-class, or is a later-scale concern.

### 5.1 Already integrated (working code exists)
| Piece | Where | Status |
|---|---|---|
| Hosting/runtime | Vercel (Next.js) | Ready to deploy, untested in prod |
| Persistent store | Upstash Redis (`@upstash/redis`, `KV_REST_API_URL/TOKEN`) | Migrated off filesystem this session, live-tested |
| Rate limiting | `@upstash/ratelimit` on the same Redis | Working, fails open by design |
| LLM content generation | Google Gemini (`GEMINI_API_KEY`, `gemini-2.5-flash`) | Working with stub fallback |
| Typed classification/ranking | TypeSafe Jev (`TYPESAFE_API_KEY`) | Working, tested live, graceful fallback |
| Maps/places data | Composio (`COMPOSIO_API_KEY`) *or* Google Places API (New) directly (`GOOGLE_PLACES_API_KEY`) | **Composio path blocked account-wide**; direct key path coded but not yet keyed |
| Google Business Profile write access | Google OAuth (`GOOGLE_OAUTH_CLIENT_ID/SECRET`) | Coded, needs Google's `business.manage` scope verification (2-6 week review) |
| WhatsApp messaging | Meta Cloud API (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, etc.) or Composio's WhatsApp toolkit | Coded, consent-gated; **WABA connection currently broken** |
| Session auth | Custom signed-cookie + magic link (no third-party auth provider) | Working, fail-closed secrets |

### 5.2 Missing and blocking a real launch
These aren't optional polish — the app can't take real users or real money without them.

1. **Transactional email provider** — Resend, Postmark, or AWS SES. Right now the magic-link sign-in literally `console.log`s the login link instead of emailing it (`auth/request/route.js` has a `// TODO: wire a real mail provider` next to it). No user can sign in today. **This is the single most blocking gap for onboarding real users.**
2. **A working Google Maps data source** — either get Composio's account-level block lifted (their support, not a config fix) or get `GOOGLE_PLACES_API_KEY` from Google Cloud (Places API (New), billing enabled). Every proposal, lead verification, competitor scan and preview site generation needs this.
3. **Error tracking** — Sentry (or Vercel's own log drain wired to something queryable). Today a production error is only visible if someone happens to be watching Vercel's live log tail. No `SENTRY_DSN` or equivalent exists anywhere in the code.
4. **A payment processor**, if `/pricing` is meant to actually charge anyone — Razorpay (natural fit for an India-based, INR-billing business; also already appears in your MCP connector list) or Stripe. There is currently zero billing code; the pricing page is informational only.
5. **Domain email deliverability** — SPF/DKIM/DMARC on whatever domain sends the magic-link and proposal emails. Without this, Gmail/Outlook will spam-box or reject the emails the moment volume ticks up past a handful a day.

### 5.3 Needed to responsibly run outreach at the scale you're planning (Wave 1-3, 1,000 leads)
6. **A real CRM** — you've mentioned Zoho CRM already; nothing in this codebase talks to it yet. Needs the Zoho CRM API (OAuth + REST) to push verified leads, scores, and outreach status so the concierge console isn't the only record of what happened.
7. **WhatsApp Business API, properly connected** — Meta Business verification + a real WABA (blocked right now), or a BSP (Gupshup, Interakt, Wati) if you'd rather not manage Meta's app review directly — a BSP is usually faster to get templates approved through and handles the compliance layer for you.
8. **A queue/scheduler for the send cadence** — the 20-leads/day WhatsApp queue currently means someone (you) manually working through a CSV. A lightweight cron (Vercel Cron, or the `schedule` skill already available in this session) that pulls the next batch and respects Meta's rate limits removes the manual step and the risk of a mis-click double-send.

### 5.4 Needed to call it "world class" rather than just functional
9. **Product analytics** — PostHog or Vercel Analytics, to see where people actually drop off in the audit → proposal → preview funnel, rather than guessing.
10. **Uptime/synthetic monitoring** — a scheduled hit against `/api/audit` and `/api/proposals` (UptimeRobot, Better Uptime, or this session's own `schedule`/`Monitor` tooling) so a Composio/Gemini/Maps outage is caught before a prospect hits it.
11. **Automated tests** — there are currently zero. At minimum: the audit scoring rubric (`audit.js`'s ~180 deterministic checks are exactly the kind of logic that silently drifts without a snapshot test), and the consent-gating logic in `whatsapp.js` (this is the one piece where a regression has real compliance consequences).
12. **A staging environment** — a second Vercel project (or a protected preview deployment) with its own Redis DB, so Round 1-3 UAT never touches production data or real Upstash keys.
13. **Legal review of `/privacy` and `/terms`** — against what the app *now* actually does: WhatsApp messaging, Jev processing of reply text, storing Google OAuth tokens, and DPDP Act obligations for the Kolkata leads' personal data (phone numbers, business details) sourced from Google Maps without direct consent from those businesses.

### 5.5 Not urgent — real later-stage items, not launch blockers
- Postgres/Supabase migration if the user base outgrows KV's simple key-value model (relational queries for reporting, joins with CRM data).
- A proper design system / component library if the UI needs to scale past what Tailwind + hand-rolled components comfortably support.
- SSO/enterprise auth if you ever sell to a franchise HQ that mandates it.
- A dedicated observability stack (Datadog/Grafana) beyond Sentry + uptime checks — overkill at this scale.

### 5.6 Summary — the shortest path to "launchable"
In order, the four things that actually block calling this production-ready:
1. Email provider wired into `auth/request/route.js` (blocks: anyone signing in).
2. A working Maps data source — Composio unblocked by their support, or a direct `GOOGLE_PLACES_API_KEY` (blocks: every proposal, audit-with-GBP, and preview).
3. Error tracking, even just Sentry's free tier (blocks: knowing when #1 or #2 breaks again).
4. A real payment processor, only if `/pricing` needs to actually charge someone before you're ready to invoice manually.

Everything else in 5.3-5.5 makes the product better and more defensible at scale, but none of it blocks a first real user going through audit → proposal → preview.
