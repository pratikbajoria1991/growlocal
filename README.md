# Growlocal

**Get found on Google, Maps, and AI.**

Growlocal is two tools in one:

1. **Visibility Audit** — paste any URL and get three scores out of 100 (SEO, AEO, GEO), each with the exact fix for every gap. Free, no signup.
2. **GBP Autopilot** — connect your Google Business Profile once, and an AI agent drafts your weekly posts, review replies, FAQ schema, and monthly report. You approve; nothing publishes automatically.

## The three surfaces

| | What it covers |
|---|---|
| **SEO** | Title tags, meta descriptions, heading structure, canonical URLs, mobile viewport, alt text, HTTPS, structured data |
| **AEO** | FAQPage schema, question-format headings, direct answer patterns, author metadata, extractable paragraphs — what gets you cited by ChatGPT, Perplexity and AI Overviews |
| **GEO** | LocalBusiness schema, geo coordinates, areaServed, opening hours, tap-to-call, location signals — what gets you into "near me" results |

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
# http://localhost:3400
```

Everything works without any API keys — audits run fully (they only need outbound HTTP), and agent actions return structured stubs.

## Environment

| Variable | Effect when set |
|---|---|
| `ANTHROPIC_API_KEY` | Agent actions generate real content via Claude instead of stubs |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | Enables the Google Business Profile connect flow |
| `SESSION_SECRET` | Signs session cookies (HMAC-SHA256) |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Encrypts stored refresh tokens (AES-256-GCM) |
| `OAUTH_STATE_SECRET` | Signs the OAuth state parameter |

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/audit` | Free SEO/AEO/GEO audit |
| `/autopilot` | GBP Autopilot product page |
| `/pricing` | Plans |
| `/login` | Magic-link auth (no passwords) |
| `/app` | Dashboard — GBP connection + AI agent actions |
| `/what-is-aeo`, `/what-is-geo` | Guides (with FAQPage schema) |
| `/privacy`, `/terms` | Legal — required for Google OAuth verification |
| `/api/audit` | Audit engine |
| `/api/agent` | AI agent runner |
| `/api/auth/*` | Magic-link auth |
| `/api/oauth/google/*` | GBP OAuth |

## Data

File-backed for MVP under `.data/` (gitignored):

```
.data/
├── users/<userId>.json         account + plan + GBP status
└── oauth-tokens/<userId>.json  encrypted refresh token
```

Swap to Postgres by replacing `src/lib/user-store.js` and `src/lib/oauth-store.js`.

## Deploy

Vercel-ready. Push to GitHub, import at [vercel.com/new](https://vercel.com/new), set env vars.

> Note: the file-backed store works on a single instance but not across serverless invocations. Move to Postgres/Redis before taking real signups.

## Stack

Next.js 16 · React 19 · Tailwind 3 · Framer Motion · Lucide
