# India high-ticket GBP batch, 20 Oct 2026: validation

Source: `output/gbp-leads/india-high-ticket-2026-10-18/Growlocal-India-High-Ticket-GBP-Leads-2026-10-20.xlsx`
(1,000 listings, 22 columns, Google Maps public listings scraped 20 Oct 2026).
Aggregates only. No business, phone or email is recorded here.

## Verdict

Usable for outreach and for aggregate statements, with four corrections:

1. **2 permanently closed listings were included** (the notes say none). One is Priority A, one B.
   Clean base is **998** listings.
2. **Photo counts are a scrape artifact.** Do not use the photo gap or any hook that cites photos.
3. **1,000 listings are about 763 organisations.** 307 listings are branches in 72 multi-site groups.
4. **Coverage is narrower than the notes imply:** 3 practice types, 62 contributing searches of the 385
   planned, and the scraper was stopped early (`context canceled`).

## 1. Reconciliation with the workbook's own notes

| Claim in notes | Found |
|---|---|
| 1,000 unique new leads | 1,000 rows, 1,000 unique Place IDs, Maps URLs and name+address pairs |
| Priority A / B / C = 46 / 146 / 808 | Matches |
| With phone / website / both = 980 / 862 / 842 | Matches (20 and 138 blank) |
| 55 cities | Matches |
| Closed excluded = 0 | **2 listings marked CLOSED**, confirmed `CLOSED_PERMANENTLY` live |
| 385 search strings | 385 planned; **62** distinct searches produced the final rows; the main scrape returned rows for 86 |
| Overlap with prior batches excluded (30) | **0** of the 1,000 match any of the earlier 3,591 listings |

## 2. Identity and duplicates

- All 1,000 Place IDs decode, and each matches the listing ID inside its own Maps URL (1,000/1,000).
- Overlap with the earlier four batches, by Google listing ID (cid): **0**.
- 53 rows share a phone number with an earlier-batch listing: chain branches (contact once).
- Within the batch: 35 phone numbers are shared; 65 website hosts are used by more than one listing
  (largest: 42 listings on one host).
- Organisations after merging listings that share a website or phone number: **763** of 998 (an approximation;
  two unrelated businesses could share a number, or one organisation could use different ones).

## 3. Internal consistency

- Priority bands follow the score: A 45 to 65, B 25 to 43, C 0 to 24. The score is explained mainly by:
  no website, low review count, rating under 4.3; photos, no hours and no phone add small amounts.
  All 46 Priority A listings have no website; 44 have under 76 reviews.
- 1,413 "Observed GBP Gaps" statements checked against their own row: **0 contradictions**, and no gap that is
  present in the data is missing from the gap text.
- Every outreach hook names the right business (1,000/1,000).
- Addresses: all 1,000 carry a 6-digit PIN; 2 sit in a town next to their search city. 53 listings do not
  contain the city name (for example Mohali listed as Sahibzada Ajit Singh Nagar), which is normal.
- Phones: 839 mobile, 130 landline with std code, 11 in other 11-digit formats (leading 0 or toll-free), 20 none. No malformed numbers.
- Websites: 839 own domains; **14 `bit.ly` short links**, 6 social, 3 free builders. 218 are listed as `http://`
  (the address as listed; redirects not tested).
- Search vertical vs Google category: 87 IVF-search rows are categorised hospital or clinic (mostly IVF hospitals).

## 4. Live re-check against Google Places (151 listings)

Sample: all 46 Priority A, 51 B (50 random plus the closed one), 54 C (random). Seeded, reproducible.

| Field | Result |
|---|---|
| Names | 151/151 match |
| Operational status | 149 operational; 2 `CLOSED_PERMANENTLY`, both the rows the workbook marks CLOSED |
| Rating | 144 compared: 143 exact, all within 0.1 |
| Review count | 151 compared: all within 3 (live minus scraped: min -1, max +3, median 0) |
| Website present | 151/151 agree; the 74 with a site on both sides have the same host; **0** "no website" listings now have one |
| Phone | 146/146 equal where both present |
| Address PIN | 151/151 equal |
| Opening hours present | 150/151 agree |

**Photos (the failure):** the scrape counted under 5 photos for 143 of 151. Live Google shows 5 or more for
**114 of those 143 (80%)**; by tier 57% of A, 84% of B, **98% of C** (46 of 47). In the scrape, photos cap at 5 and
535 of 1,000 are zero, so zero means "not captured". About 680 of the 697 Priority C listings flagged for photos are
flagged wrongly. 546 rows have the photo gap as their only gap, and 550 hooks cite photos.

## 5. What this means for the priority list

Priority C (808) is mostly the photo artifact. The reliable leads are Priority A and B (190 after removing the two
closed), which are driven by no website, few reviews and low rating, all of which the live check confirmed.

## 6. Used on the website

Only fields the live check confirmed, over the 998: no website 136 (13.6%), under 76 reviews 197 (19.7%),
median reviews 352, rating under 4.3 136 (13.6%), rated 4.5 or higher 773 (77.5%), no website and under 76 reviews 59 (5.9%).
Combined with the 3,591 audited listings: **4,589** listings studied. Figures live in `INDIA_BATCH` in
`src/lib/market-data.js`.

## 7. Not done, and open

- 849 listings were not re-fetched. In the sample 0 of 149 non-flagged listings were closed, so up to about 2%
  (95% bound) of the rest could be, which is not ruled out. A full status check costs roughly 850 Place Details calls.
- Photo counts were not re-measured for the whole batch (the API returns at most 10).
- The 14 `bit.ly` links were not resolved; the `http://` addresses were not tested for redirects.
- No website audit, ranking search or AI check was run on this batch.
- 48 of 55 cities have one practice type only, so city comparisons are invalid.
