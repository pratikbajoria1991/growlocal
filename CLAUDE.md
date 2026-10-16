# Growlocal

All Growlocal work goes into this app (this folder) and ships to the Vercel
project `growlocal`, live at https://growlocal-delta.vercel.app. Don't start
separate copies or other apps for Growlocal changes.

- Branch: `growth-tools-and-hardening` (not pushed to GitHub yet).
- Deploy: `npx vercel deploy --prod --yes`, then confirm a new deployment
  appears in `npx vercel ls growlocal` — the command sometimes exits without
  deploying, so check before saying it's live.
- Market numbers shown on the site live in `src/lib/market-data.js`
  (`MARKET` = 3 Oct 2026 audit, `HIGH_TICKET` = 15 Oct 2026 workbook).
  Publish aggregates only; never a business's name, phone or email.
- Design tokens are in `tailwind.config.js` and `src/app/globals.css`. The
  green brand accent keeps the token name `indigo`; 600+ for text on light
  backgrounds, `brand` / `.btn-premium` for primary buttons.
- The C: drive runs close to full. Delete `.next` after local builds.
