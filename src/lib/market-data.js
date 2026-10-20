// Aggregate findings from Growlocal's own audits — no business is named.
// Source: live Google Places data + our SEO/AEO/GEO website audit, combined
// across every batch in output/gbp-leads/ (final.json in high-ticket/ 2 Oct,
// previous-1000/ 3 Oct, second-high-ticket/ 6 Oct, third-high-ticket/ 15 Oct):
// 3,851 rows -> 18 no longer on Google -> 242 duplicates removed by Maps CID
// -> 3,591 unique businesses. The list is the businesses we chose to audit
// (clinics, skin and dental care, jewellers, furniture, interiors, real estate,
// salons, professional services and similar), not a random sample of every
// business in the city — the page says so.
// Definitions: website %s are over listings whose site was fetched (site.ok);
// review gap is over listings with a comparable top 3; the rest are over all
// unique businesses. Regenerate with the same rules when a batch is added.

export const MARKET = {
  asOf: "2–15 Oct 2026",
  businesses: 3591,
  auditedSites: 2244,
  rankedSearches: 3591, // one live search per business for its own category + area
  aeoBelow50: 87, // % of audited websites scoring under 50/100 for AI answer-engine readiness
  geoBelow50: 77, // % under 50/100 for local/entity signals
  noFaqSchema: 89, // % of audited websites with no FAQPage markup
  notInTop20: 36, // % absent from Google's top 20 for their own category + area
  top3: 26, // % in the top 3 for that search
  reviewGap: 58, // % (of 3,432 comparable) with at least 1.5x fewer reviews than the top-3 results
  noWebsite: 29, // % whose Google profile links no website
  deadSites: 118, // distinct websites linked on a Google profile whose domain no longer resolves
  fewPhotos: 27, // % with fewer than 10 profile photos
};

// High-ticket Kolkata study, 15 October 2026 — aggregates only, no business named.
// Source: output/gbp-leads/third-high-ticket/
// Growlocal-Kolkata-HighTicket3-Verified-Outreach-2026-10-15.xlsx (Outreach Pack +
// Held & Excluded = 851 listings; Sheet vs Live Google; Audit & Recommendations;
// Not Yet Measured) and pipeline.log for website reachability.
export const HIGH_TICKET = {
  asOf: "15 Oct 2026",
  listings: 851,
  categories: 17, // excluding 21 listings whose category was unconfirmed
  // Validation: every listing re-fetched from live Google before use.
  liveChecked: 851,
  liveNotFound: 0,
  liveCorrected: 271, // scraped values that no longer matched live Google (271 review counts, 15 ratings)
  heldOut: 176, // branches covered by a flagship account, unconfirmed categories, temporarily closed
  // Findings
  notInTop20: 32, // % (270 of 851) absent from Google's top 20 for their own category + area
  reviewGap: 53, // % (429 of 804 comparable) with at least 1.5x fewer reviews than the top 3
  medianReviewGap: 1.7, // median ratio of top-3 reviews to theirs
  noWebsite: 25, // % (214 of 851) linking no website on Google
  sitesScored: 569,
  aeoBelow50: 89, // % (504 of 569) of their own websites under 50/100 for AI answer readiness
  aeoZero: 85, // websites scoring 0/100
  medianAeo: 24,
  sitesChecked: 442, // distinct websites
  sitesBroken: 32, // 24 dead domains, 6 unreachable, 2 returning 404
  // Work plan
  fixes: 2110,
  weDo: 1074,
  afterOk: 494,
  needOwner: 542,
  // What the study could not measure, and why
  notMeasured: [
    ["Review velocity", "needs two dated snapshots; measurable from 29 Oct 2026"],
    ["Calls and direction requests", "needs Google Business Profile access after the owner connects"],
    ["Review recency", "Google's API returns the 5 most relevant reviews, not the newest"],
    ["Photo counts above 10", "the API returns at most 10 photos"],
  ],
};

// Google profile study, 20 October 2026 — aggregates only, no business named.
// Source: output/gbp-leads/india-high-ticket-2026-10-18/
// Growlocal-India-High-Ticket-GBP-Leads-2026-10-20.xlsx (1,000 public Google
// Maps listings, 55 Indian cities) — analysed and validated 20 Oct 2026.
// All figures are over the 998 listings left after removing 2 that live Google
// shows as permanently closed. Only fields the live re-check confirmed are used
// (website, phone, rating, review count, address, hours). Photo counts are NOT
// used: the scrape caps photos at 5, and live Google showed 5+ photos for 114
// of the 143 sampled listings it counted as under 5.
// Full method and checks: docs/data/india-batch-2026-10-20-validation.md
export const INDIA_BATCH = {
  asOf: "20 Oct 2026",
  collected: 1000,
  closedRemoved: 2,
  listings: 998,
  cities: 55,
  types: [
    ["IVF and fertility centres", 527],
    ["multi-specialty hospitals", 451],
    ["bariatric surgery clinics", 20],
  ],
  // Validation
  overlapWithEarlier: 0, // of 1,000, matched to the earlier listings by Google's own listing ID
  liveChecked: 151, // all 46 Priority A + 51 B + 54 C, re-fetched from Google Places
  organisations: 763, // distinct organisations after merging shared websites and phone numbers
  branchListings: 307,
  branchGroups: 72,
  // Findings (counts over the 998; the page shows rounded percentages)
  noWebsite: 136,
  reviewsUnder76: 197,
  medianReviews: 352,
  ratedUnder43: 136,
  rated45Plus: 773,
  noWebsiteAndUnder76: 59,
  photoFlagFalse: { checked: 143, wrong: 114 }, // sampled listings the scrape counted as under 5 photos; live Google shows 5+
};

// Every unique Google listing we hold profile data for: the 3,591 audited
// (websites scored, rankings searched) plus the 998 profile-only listings.
export const TOTAL_LISTINGS = MARKET.businesses + INDIA_BATCH.listings;
