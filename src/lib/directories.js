// Citation directories for Indian local businesses.
//
// There is no "submit to ChatGPT" API. What actually gets a business quoted by
// an answer engine is (a) their own AEO markup, (b) crawler access, and (c)
// being present in the high-authority third-party sources those systems crawl
// and retrieve from. This file is (c) — the manual submission work, which is
// exactly the service StartupSubmit sells for startups, aimed at local verticals.
//
// `weight` is our JUDGEMENT of value for a Kolkata-area local business —
// authority + how heavily the source is crawled + India relevance. It is not a
// measured citation rate. We have not verified which directories any specific
// LLM quotes, and we should never tell a client we have.

export const CITATION_STATUSES = [
  { id: "todo", label: "Not started" },
  { id: "submitted", label: "Submitted" },
  { id: "owner_action", label: "Waiting on owner" }, // e.g. a verification code or call
  { id: "needs_fix", label: "Listed, details wrong" },
  { id: "live", label: "Live" },
  { id: "rejected", label: "Rejected" },
  { id: "na", label: "Not applicable" },
];

const UNIVERSAL = [
  { id: "gbp", name: "Google Business Profile", url: "https://business.google.com/", weight: 10, why: "The single highest-value listing. Feeds Google Search, Maps, and the local data many AI assistants retrieve." },
  { id: "bing-places", name: "Bing Places", url: "https://www.bingplaces.com/", weight: 9, why: "Bing's index backs ChatGPT search and Copilot. Frequently the cheapest win nobody does." },
  { id: "apple-business", name: "Apple Business Connect", url: "https://businessconnect.apple.com/", weight: 7, why: "Apple Maps and Siri results. Free, fast, and almost never claimed by Indian SMBs." },
  { id: "justdial", name: "Justdial", url: "https://www.justdial.com/", weight: 9, why: "Dominant Indian local directory with heavy crawl coverage across every vertical." },
  { id: "sulekha", name: "Sulekha", url: "https://www.sulekha.com/", weight: 7, why: "Strong India local-services authority, especially for service businesses." },
  { id: "facebook", name: "Facebook Page", url: "https://www.facebook.com/business/pages", weight: 6, why: "Widely crawled, carries NAP consistency signals and review surface." },
  { id: "instagram", name: "Instagram Business", url: "https://business.instagram.com/", weight: 5, why: "Discovery for visual verticals; supports brand-name search results." },
  { id: "linkedin", name: "LinkedIn Company Page", url: "https://www.linkedin.com/company/setup/new/", weight: 5, why: "High domain authority; strengthens entity recognition for the business name." },
  { id: "foursquare", name: "Foursquare", url: "https://foursquare.com/venue/claim", weight: 5, why: "Syndicates place data to many downstream map and assistant products." },
  { id: "yelp-in", name: "Yelp", url: "https://biz.yelp.com/", weight: 4, why: "Lower India traffic, but high domain authority and consistently crawled." },
  { id: "indiamart", name: "IndiaMART", url: "https://seller.indiamart.com/", weight: 4, why: "Best for product/trade businesses; broad crawl coverage." },
];

// Vertical-specific directories, matched on keywords found in the client's vertical.
const VERTICAL = [
  {
    match: /dent|clinic|doctor|medical|health|physio|hospital|diagnost|lab/i,
    label: "Healthcare",
    entries: [
      { id: "practo", name: "Practo", url: "https://www.practo.com/providers", weight: 9, why: "The default healthcare discovery platform in India. High authority for clinic and doctor queries." },
      { id: "lybrate", name: "Lybrate", url: "https://www.lybrate.com/", weight: 6, why: "Doctor listings and Q&A content that gets indexed well." },
      { id: "credihealth", name: "Credihealth", url: "https://www.credihealth.com/", weight: 5, why: "Hospital and specialist listings with decent crawl coverage." },
    ],
  },
  {
    match: /restaurant|cafe|food|bakery|catering|cloud kitchen|dhaba|bar\b/i,
    label: "Food & dining",
    entries: [
      { id: "zomato", name: "Zomato", url: "https://www.zomato.com/partner_with_us", weight: 10, why: "Dominant food discovery in India and heavily cited for restaurant queries." },
      { id: "swiggy", name: "Swiggy", url: "https://partner.swiggy.com/", weight: 9, why: "Delivery demand plus a strongly indexed listing page." },
      { id: "tripadvisor", name: "TripAdvisor", url: "https://www.tripadvisor.in/Owners", weight: 7, why: "Very high global domain authority; strong for tourist-intent searches." },
      { id: "eazydiner", name: "EazyDiner", url: "https://www.eazydiner.com/", weight: 4, why: "Dine-in reservations, useful for mid/premium restaurants." },
    ],
  },
  {
    match: /salon|spa|beauty|hair|nail|makeup|grooming|barber/i,
    label: "Beauty & wellness",
    entries: [
      { id: "urban-company", name: "Urban Company", url: "https://partner.urbancompany.com/", weight: 8, why: "Major at-home services demand plus strong brand authority." },
      { id: "fresha", name: "Fresha", url: "https://www.fresha.com/for-business", weight: 5, why: "Booking platform with indexed salon profiles." },
      { id: "nearbuy", name: "Nearbuy", url: "https://www.nearbuy.com/", weight: 4, why: "Deals-led discovery for salons and spas." },
    ],
  },
  {
    match: /hotel|resort|homestay|guest house|lodge|travel|tour/i,
    label: "Hospitality & travel",
    entries: [
      { id: "tripadvisor-h", name: "TripAdvisor", url: "https://www.tripadvisor.in/Owners", weight: 10, why: "The highest-authority travel source; very frequently retrieved for travel queries." },
      { id: "booking", name: "Booking.com", url: "https://join.booking.com/", weight: 9, why: "Huge authority and near-universal crawl coverage for accommodation." },
      { id: "makemytrip", name: "MakeMyTrip", url: "https://extranet.makemytrip.com/", weight: 8, why: "Leading Indian OTA; strong for domestic travel intent." },
      { id: "goibibo", name: "Goibibo", url: "https://www.goibibo.com/", weight: 6, why: "Second Indian OTA surface, low incremental effort once MMT is done." },
    ],
  },
  {
    match: /gym|fitness|yoga|crossfit|pilates|zumba|training/i,
    label: "Fitness",
    entries: [
      { id: "fitternity", name: "Fitternity", url: "https://www.fitternity.com/", weight: 6, why: "India fitness discovery with indexed studio pages." },
      { id: "cultpass", name: "Cult.fit Partner", url: "https://www.cult.fit/partner", weight: 6, why: "Partner network listing plus meaningful local demand." },
    ],
  },
  {
    match: /lawyer|legal|advocate|chartered|accountant|\bca\b|consult|agency|architect/i,
    label: "Professional services",
    entries: [
      { id: "lawrato", name: "LawRato", url: "https://lawrato.com/", weight: 6, why: "Legal directory with strong question-and-answer content indexing." },
      { id: "clutch", name: "Clutch", url: "https://clutch.co/", weight: 6, why: "High-authority B2B services directory, well crawled." },
      { id: "goodfirms", name: "GoodFirms", url: "https://www.goodfirms.co/", weight: 5, why: "B2B agency and services listings with solid domain authority." },
    ],
  },
  {
    match: /school|coaching|tuition|institute|academy|education|training centre|classes/i,
    label: "Education",
    entries: [
      { id: "urbanpro", name: "UrbanPro", url: "https://www.urbanpro.com/", weight: 7, why: "Leading India tutor and coaching marketplace with heavy indexing." },
      { id: "shiksha", name: "Shiksha", url: "https://www.shiksha.com/", weight: 6, why: "High-authority education portal for institutes and courses." },
    ],
  },
  {
    match: /real estate|property|realtor|broker|builder|interior|renovation|construction/i,
    label: "Property & home",
    entries: [
      { id: "99acres", name: "99acres", url: "https://www.99acres.com/", weight: 8, why: "Top Indian property portal; strong authority for location-based queries." },
      { id: "magicbricks", name: "MagicBricks", url: "https://www.magicbricks.com/", weight: 7, why: "Second major property portal, well crawled." },
      { id: "housing", name: "Housing.com", url: "https://housing.com/", weight: 6, why: "Good content depth and indexing for locality queries." },
    ],
  },
];

/**
 * The directory set for a client, highest value first.
 * Universal listings always apply; vertical ones are matched on their vertical text.
 */
export function directoriesFor(vertical = "") {
  const v = String(vertical || "");
  const matched = VERTICAL.filter((g) => g.match.test(v));

  const vertEntries = matched.flatMap((g) => g.entries.map((e) => ({ ...e, group: g.label })));
  const universal = UNIVERSAL.map((e) => ({ ...e, group: "Every business" }));

  return [...universal, ...vertEntries].sort((a, b) => b.weight - a.weight);
}

export function verticalGroupsFor(vertical = "") {
  return VERTICAL.filter((g) => g.match.test(String(vertical || ""))).map((g) => g.label);
}

// Progress = weighted, so getting Google Business Profile live counts for far
// more than claiming a low-value listing.
export function citationProgress(directories, state = {}) {
  const applicable = directories.filter((d) => state[d.id]?.status !== "na");
  const total = applicable.reduce((n, d) => n + d.weight, 0);
  const earned = applicable.reduce((n, d) => n + (state[d.id]?.status === "live" ? d.weight : 0), 0);
  const count = (s) => applicable.filter((d) => state[d.id]?.status === s).length;
  const live = count("live");
  const submitted = count("submitted");
  const ownerAction = count("owner_action");
  const needsFix = count("needs_fix");

  return {
    percent: total ? Math.round((earned / total) * 100) : 0,
    live,
    submitted,
    ownerAction,
    needsFix,
    remaining: applicable.length - live - submitted - ownerAction - needsFix,
    count: applicable.length,
  };
}
