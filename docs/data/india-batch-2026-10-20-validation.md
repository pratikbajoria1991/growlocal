# India high-ticket GBP batch, 20 Oct 2026: validation

Source: `output/gbp-leads/india-high-ticket-2026-10-18/Growlocal-India-High-Ticket-GBP-Leads-2026-10-20.xlsx`
(1,000 listings, 22 columns, Google Maps public listings scraped 20 Oct 2026).
Aggregates only. No business, phone or email is recorded here.

**All 1,000 listings were re-fetched from the live Google Places API in one pass on 20 Oct 2026.** Every figure
below and on the website is a live value over the listings Google shows as open. No sampling, no estimates.

The corrected workbook is `Growlocal-India-High-Ticket-GBP-Leads-2026-10-20-VERIFIED.xlsx` in the same folder
(original untouched). Use it, not the original, for outreach.

## Verdict

Usable, with four corrections to the original:

1. **3 listings are closed on Google and were included** (the notes say none): 2 permanently, 1 temporarily.
   The scrape flagged only 2 of them. Clean base: **997** listings.
2. **Photo counts were a scrape artifact.** The scrape counted under 5 photos for 888 listings; live Google shows
   5 or more for **819 of them (92%)**. Only 68 of the 997 really have fewer than 5.
3. **1,000 listings are about 763 organisations.** 306 listings are branches in 72 multi-site groups.
4. **Coverage is narrower than the notes imply:** 3 practice types, 62 contributing searches of the 385 planned,
   and the scraper was stopped early (`context canceled`).

## 1. Reconciliation with the workbook's own notes

| Claim in notes | Found |
|---|---|
| 1,000 unique new leads | 1,000 rows; unique Place IDs, Maps URLs and name+address pairs |
| Priority A / B / C = 46 / 146 / 808 | Matches (45 / 145 / 807 after removing the closed) |
| With phone / website / both = 980 / 862 / 842 | Matches |
| 55 cities | Matches |
| Closed excluded = 0 | **3 closed on live Google** (2 flagged CLOSED in the scrape) |
| 385 search strings | 385 planned; **62** distinct searches produced the final rows; the main scrape returned rows for 86 |
| Overlap with prior batches excluded (30) | **0** of the 1,000 match any of the earlier 3,591 listings |

## 2. Identity and duplicates

- All 1,000 Place IDs decode, and each matches the listing ID inside its own Maps URL (1,000/1,000).
- Overlap with the earlier four batches, by Google listing ID (cid): **0**.
- 52 operational listings share a phone number with an earlier-batch listing: chain branches (contact once).
- Organisations after merging listings that share a website or phone number: **763** of 997 (an approximation;
  unrelated businesses could share a number, or one organisation could use several).

## 3. Internal consistency of the workbook

- Priority bands follow the score: A 45 to 65, B 25 to 43, C 0 to 24. The score is explained mainly by no website,
  low review count and rating under 4.3. All 46 Priority A listings have no website.
- 1,413 "Observed GBP Gaps" statements checked against their own row: 0 contradictions.
- Every outreach hook names the right business, but hooks cite only the first gap, and 550 cite photos.
- Addresses: all carry a 6-digit PIN; 2 sit in a town next to their search city.
- Phones: 839 mobile, 130 landline with std code, 11 in other 11-digit formats, 20 none.
- Websites: 839 own domains; 14 `bit.ly` short links, 6 social, 3 free builders; 218 listed as `http://`.

## 4. Live re-check against Google Places (all 1,000)

| Field | Result |
|---|---|
| Fetched | 1,000 of 1,000 (0 not found) |
| Names | 1,000/1,000 identical or equivalent (2 non-Latin names are byte-identical) |
| Operational status | 997 operational; 2 `CLOSED_PERMANENTLY`; 1 `CLOSED_TEMPORARILY` |
| Rating | 989 rated on both sides: 988 exact, all within 0.1; 11 unrated on both; 0 presence mismatches |
| Review count | 942 identical; 995 within 3; all within 10 (live minus scraped: min -5, max +9, median 0) |
| Website present | 1,000/1,000 agree; the 862 with a site on both sides are the same site |
| Phone | 980/980 equal where both present; presence agrees on all |
| Address PIN | 1,000/1,000 equal |
| Opening hours present | 999/1,000 agree |

**Photos:** scraped under 5 = 888; live under 5 = 69 (68 operational); scraped under 5 but live 5 or more = **819**.
Live Google returns at most 10 photos, so "under 5" is exact. The scrape caps at 5 and 535 are zero (not captured).

## 5. Priority

The workbook's Priority C (807 operational) was mostly the photo artifact. The corrected workbook uses a
transparent tier on live values: strong gaps = no website, under 76 reviews, rating under 4.3.

| Tier | Rule | Listings | Organisations |
|---|---|---|---|
| Tier 1 | 2 or more strong gaps | 100 | 98 |
| Tier 2 | exactly 1 | 248 | 227 |
| Tier 3 | none (photos, phone, hours shown, not tiered) | 649 | 463 |

Outreach hooks in the corrected workbook cite only gaps that are true on live data.

## 6. Used on the website

Over the 997: no website 136 (13.6%), under 76 reviews 197 (19.8%), median reviews 351, rating under 4.3 136 (13.6%),
rated 4.5 or higher 772, no website and under 76 reviews 59 (5.9%), under 5 photos 68. Combined with the 3,591
audited listings: **4,588** listings studied. Figures live in `INDIA_BATCH` in `src/lib/market-data.js`.

## 7. Not covered

- This batch has no website audit, ranking search or AI check (profile data only).
- The earlier four batches (3,591 listings) were each verified against live Google when collected, 2 to 15 Oct. They
  were not re-fetched on 20 Oct, so review counts there can differ slightly from today.
- The 14 `bit.ly` links were not resolved; `http://` addresses were not tested for redirects.
- 48 of 55 cities have one practice type only, so city comparisons are invalid.
