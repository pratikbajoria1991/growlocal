// Competitor discovery — the "Discover" step.
//
// For a resolved place, finds the nearest businesses of the same kind, where
// the business appears in Google's results for its own category + area, and
// records everyone's review count so review *pace* can be measured over time.
//
// What this deliberately does not claim:
//   - Map Pack rank. Rank changes street by street with the searcher's
//     location; one search from one query is a position, not "your rank".
//   - Review velocity on day one. The Places API returns 5 reviews sorted by
//     relevance, not date, so pace can't be read from them honestly. We
//     snapshot review counts instead and measure the change between snapshots.

import { placesBatch, distanceMeters } from "./places";
import { get, set } from "./store";

// Places types too broad to say anything about what a business competes on.
const GENERIC = new Set([
  "point_of_interest", "establishment", "store", "health", "food", "finance",
  "premise", "political", "locality", "sublocality", "geocode", "service",
]);

// Kept lean on purpose: photos, reviews and hours are large objects, and 20
// competitors' worth of them exceeds what Composio returns inline. Competitor
// photo counts are therefore unknown (null), never assumed to be zero.
const COMPETITOR_FIELDS = [
  "id", "displayName", "primaryType", "types", "rating",
  "userRatingCount", "websiteUri", "location", "businessStatus", "googleMapsUri",
];

// Places Google tags with a business type they merely contain — a mall with
// food courts shows up in a "restaurant" nearby search. Not competitors.
const NOT_A_COMPETITOR = new Set([
  "shopping_mall", "department_store", "tourist_attraction", "amusement_park",
  "university", "school", "train_station", "airport", "lodging", "hotel",
]);

const SNAPSHOT_EVERY_MS = 6 * 86_400_000;
const PACE_MIN_DAYS = 14;

export function median(values) {
  const s = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function addressPart(place, ...wanted) {
  for (const type of wanted) {
    const c = (place.addressComponents || []).find((x) => (x.types || []).includes(type));
    if (c) return c.longText || c.shortText || null;
  }
  return null;
}

// The phrase a customer would plausibly type: "dental clinic in Bidhannagar, Kolkata".
// `type` overrides the primary type when that one couldn't be searched on.
export function searchPhrase(place, type = null) {
  const useType = type || place.primaryType;
  const label = (type && type !== place.primaryType
    ? type.replace(/_/g, " ")
    : place.primaryTypeDisplayName?.text || String(useType || "").replace(/_/g, " ")
  ).toLowerCase().trim();
  const area = addressPart(place, "sublocality_level_1", "neighborhood", "sublocality");
  const city = addressPart(place, "locality", "administrative_area_level_2");
  const where = [...new Set([area, city].filter(Boolean))].join(", ");
  if (!label || !where || GENERIC.has(useType)) return null;
  return `${label} in ${where}`;
}

const INVALID_TYPE = /invalid place type/i;

function summarize(p, origin) {
  const photos = Array.isArray(p.photos) ? p.photos.length : null;
  return {
    id: p.id,
    name: p.displayName?.text || "Unnamed business",
    rating: p.rating ?? null,
    reviews: p.userRatingCount ?? 0,
    photos,
    // Google's API returns at most 10 photos, so 10 means "10 or more".
    photosAtLeast: photos != null && photos >= 10,
    hasWebsite: Boolean(p.websiteUri),
    types: p.types || [],
    mapsUri: p.googleMapsUri || null,
    distanceM: distanceMeters(origin, p.location),
  };
}

// Saves a review-count snapshot (at most weekly) and returns measured pace
// once there's enough history to mean something.
async function snapshotAndPace(business) {
  const key = `snap:${business.id}`;
  const now = Date.now();
  let history = [];
  try { history = (await get(key)) || []; } catch { return null; }

  const last = history.at(-1);
  if (!last || now - new Date(last.at).getTime() >= SNAPSHOT_EVERY_MS) {
    history = [...history, { at: new Date(now).toISOString(), reviews: business.reviews, rating: business.rating }].slice(-60);
    try { await set(key, history); } catch { /* pace still computable from what we read */ }
  }

  const oldest = history.find((h) => (now - new Date(h.at).getTime()) / 86_400_000 >= PACE_MIN_DAYS);
  if (!oldest) return { measuredSince: history[0].at, reviewsPer30Days: null };
  const days = (now - new Date(oldest.at).getTime()) / 86_400_000;
  return {
    measuredSince: oldest.at,
    reviewsPer30Days: Math.round(((business.reviews - oldest.reviews) / days) * 30 * 10) / 10,
  };
}

export async function discoverCompetitors(place, { max = 8 } = {}) {
  const origin = place.location;
  // Fallback types are ordered by how closely they match the listing's own
  // category label. Google's `types` array isn't ordered by relevance: a
  // "Fine Dining Restaurant" can list "bar" before "restaurant", and searching
  // "bar" compares it with nightclubs and malls instead of other restaurants.
  const labelWords = new Set(String(place.primaryTypeDisplayName?.text || "").toLowerCase().split(/[^a-z]+/).filter(Boolean));
  const matchScore = (t) => t.split("_").filter((w) => labelWords.has(w)).length;
  const others = [...new Set((place.types || []).filter((t) => t && t !== place.primaryType && !GENERIC.has(t)))]
    .map((t, i) => ({ t, i, s: matchScore(t) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.t);
  const candidates = [place.primaryType, ...others].filter((t) => t && !GENERIC.has(t));
  let type = candidates[0];
  let phrase = searchPhrase(place);
  const result = { type, phrase, position: null, competitors: [], stats: null, self: null, notes: [] };

  if (!origin || !type) {
    result.notes.push("We couldn't pin down this business's category or location precisely enough to compare it with competitors.");
    return result;
  }

  const nearbyReq = (t, radius) => ({ kind: "nearby", lat: origin.latitude, lng: origin.longitude, radius, types: [t], max: 20, fields: COMPETITOR_FIELDS });
  const textReq = (q) => ({ kind: "text", query: q, max: 20, fields: ["id", "displayName", "location", "businessStatus"] });

  const first = [nearbyReq(type, 2500)];
  if (phrase) first.push(textReq(phrase));
  let [nearby, text] = await placesBatch(first);

  // Google only filters nearby search by its core ("Table A") types, and a
  // listing's primary type isn't always one — "bar_and_grill" isn't, while
  // "restaurant" is. Walk down the listing's own types until one is accepted,
  // and search the phrase for that type so the position is like-for-like.
  for (const next of candidates.slice(1, 4)) {
    if (!(nearby instanceof Error) || !INVALID_TYPE.test(nearby.message)) break;
    type = next;
    phrase = searchPhrase(place, next);
    [nearby, text] = await placesBatch(phrase ? [nearbyReq(next, 2500), textReq(phrase)] : [nearbyReq(next, 2500)]);
  }
  result.type = type;
  result.phrase = phrase;

  // Sparse area: widen once before giving up on a comparison.
  const usable = (list) => (Array.isArray(list)
    ? list.filter((p) =>
        p.id !== place.id
        && (p.businessStatus || "OPERATIONAL") === "OPERATIONAL"
        // Keep a same-kind business even if it's also tagged e.g. "lodging"
        // (a hotel restaurant); drop places whose primary identity is the venue.
        && !(NOT_A_COMPETITOR.has(p.primaryType) && p.primaryType !== place.primaryType))
    : []);
  if (!(nearby instanceof Error) && usable(nearby).length < 3) {
    const [wider] = await placesBatch([nearbyReq(type, 6000)]);
    if (!(wider instanceof Error) && usable(wider).length > usable(nearby).length) nearby = wider;
  }

  if (nearby instanceof Error) {
    result.notes.push(INVALID_TYPE.test(nearby.message)
      ? "Google's nearby search doesn't support this business's categories, so we couldn't compare competitors."
      : "We couldn't look up nearby competitors this time.");
  }

  if (Array.isArray(text)) {
    const idx = text.findIndex((p) => p.id === place.id);
    result.position = { query: phrase, rank: idx >= 0 ? idx + 1 : null, of: text.length };
  } else if (text instanceof Error) {
    result.notes.push("We couldn't check where you appear in Google's results this time.");
  }

  result.competitors = usable(nearby).slice(0, max).map((p) => summarize(p, origin));
  result.self = summarize(place, origin);

  // Snapshot everyone we looked at — this is how review pace becomes real data.
  const paces = await Promise.all([result.self, ...result.competitors].map(snapshotAndPace));
  result.self.pace = paces[0];
  result.competitors.forEach((c, i) => { c.pace = paces[i + 1]; });

  const comps = result.competitors;
  if (comps.length) {
    const typeCounts = new Map();
    for (const c of comps) {
      for (const t of new Set(c.types)) {
        if (GENERIC.has(t) || (place.types || []).includes(t)) continue;
        typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
      }
    }
    const measuredPaces = comps.map((c) => c.pace?.reviewsPer30Days).filter((v) => v != null);

    result.stats = {
      count: comps.length,
      medianReviews: Math.round(median(comps.map((c) => c.reviews)) ?? 0),
      medianRating: median(comps.map((c) => c.rating).filter((r) => r != null)),
      withWebsite: comps.filter((c) => c.hasWebsite).length,
      withTenPhotos: comps.every((c) => c.photos == null) ? null : comps.filter((c) => c.photosAtLeast).length,
      medianPace: measuredPaces.length >= 3 ? median(measuredPaces) : null,
      commonTypes: [...typeCounts.entries()]
        .map(([t, n]) => ({ type: t, label: t.replace(/_/g, " "), count: n, share: n / comps.length }))
        .filter((t) => t.count >= 2 && t.share >= 0.4)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    };
  }

  return result;
}
