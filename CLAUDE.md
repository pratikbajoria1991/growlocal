# Growlocal

All Growlocal work goes into this app (this folder) and ships to the Vercel
project `growlocal`, live at https://growlocal-delta.vercel.app. Don't start
separate copies or other apps for Growlocal changes.

- Branch: `growth-tools-and-hardening` (not pushed to GitHub yet).
- Deploy: `npx vercel deploy --prod --yes`, then confirm a new deployment
  appears in `npx vercel ls growlocal` — the command sometimes exits without
  deploying, so check before saying it's live.
- Market numbers shown on the site live in `src/lib/market-data.js`
  (`MARKET` = all batches 2–15 Oct 2026 combined and de-duplicated, 3,591
  businesses; `HIGH_TICKET` = 15 Oct 2026 workbook). When a new batch lands,
  recompute MARKET over every batch's final.json with the rules in the file.
  Publish aggregates only; never a business's name, phone or email.
- Design tokens are in `tailwind.config.js` and `src/app/globals.css`. The
  green brand accent keeps the token name `indigo`; 600+ for text on light
  backgrounds, `brand` / `.btn-premium` for primary buttons.
- The C: drive runs close to full. Delete `.next` after local builds.
- Market: launch in India first (₹ pricing, DPDP, Indian directories stay).
  Site copy is location-neutral — never name a city in visible text. When a
  first country abroad is chosen, add a per-country config (currency,
  payments, privacy law, directory list) rather than editing copy inline.
- GitHub: origin is github.com/pratikbajoria1991/growlocal (PUBLIC). Push the
  working branch after committing; never commit .env files or lead data.
