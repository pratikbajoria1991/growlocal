// Aggregate findings from Growlocal's own audits — no business is named.
// Source: live Google Places data + our SEO/AEO/GEO website audit, run on
// 1,856 unique Kolkata businesses on 1–3 October 2026. The list is the
// businesses we chose to audit (clinics, dental, eye care, fertility,
// interiors, real estate, salons, professional services and similar), not a
// random sample of every business in the city — the page says so.
// Regenerate by re-running the pipeline in output/gbp-leads/ and updating here.

export const MARKET = {
  asOf: "3 Oct 2026",
  city: "Kolkata",
  businesses: 1856,
  auditedSites: 1151,
  rankedSearches: 1324,
  aeoBelow50: 85, // % of audited websites scoring under 50/100 for AI answer-engine readiness
  geoBelow50: 80, // % under 50/100 for local/entity signals
  noFaqSchema: 89, // % of audited websites with no FAQPage markup
  notInTop20: 38, // % absent from Google's top 20 for their own category + area
  top3: 26, // % in the top 3 for that search
  reviewGap: 58, // % with at least 1.5x fewer reviews than the top-3 results for their own search
  noWebsite: 29, // % whose Google profile links no website
  deadSites: 68, // websites linked on a Google profile whose domain no longer resolves
  fewPhotos: 29, // % with fewer than 10 profile photos
};
