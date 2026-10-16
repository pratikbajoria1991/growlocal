// Where does a business appear when someone searches Google Maps for a
// keyword in an area? Uses Places Text Search, which returns results in the
// order Google ranks them for that query. Google also ranks by where the
// searcher is, and our servers aren't in the customer's city, so we first
// locate the area and then search as if from its centre. It still isn't a
// search from one particular street, so positions can differ a little.

import { placesBatch, PlacesError } from "./places.js";

const FIELDS = ["id", "displayName", "rating", "userRatingCount", "websiteUri", "primaryTypeDisplayName", "googleMapsUri"];

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(the|pvt|ltd|private|limited|llp)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hostOf = (u) => {
  try {
    return new URL(/^https?:/i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

function matches(place, target) {
  if (target.host) return hostOf(place.websiteUri || "") === target.host;
  const a = norm(place.displayName?.text);
  const b = target.name;
  if (!a || !b) return false;
  if (a === b) return true;
  // Whole-word matching only: "Ram Dental" must not match "Dental" or
  // "Ramesh Clinic". One name's words may contain the other's when the
  // shorter name has at least two words (Google listings often add a suffix
  // like "- Gynaecologist").
  const ta = a.split(" ");
  const tb = b.split(" ");
  const sa = new Set(ta);
  const sb = new Set(tb);
  if (tb.length >= 2 && tb.every((t) => sa.has(t))) return true;
  if (ta.length >= 2 && ta.every((t) => sb.has(t))) return true;
  const shared = tb.filter((t) => sa.has(t)).length;
  return shared / Math.max(sa.size, sb.size) >= 0.6;
}

/**
 * @param {{business:string, keyword:string, area:string}} input
 *   business: the business name as on Google, or its website.
 */
export async function mapsRank({ business, keyword, area }) {
  const query = `${keyword.trim()} in ${area.trim()}`;
  const looksLikeSite = /\.[a-z]{2,}(\/|$)/i.test(business.trim()) && !/\s/.test(business.trim());
  const target = looksLikeSite ? { host: hostOf(business.trim()) } : { name: norm(business) };

  const [spot] = await placesBatch([{ kind: "text", query: area.trim(), max: 1, region: "in", fields: ["location"] }]);
  if (spot instanceof PlacesError) throw spot;
  const center = spot[0]?.location;
  if (!center) {
    const e = new Error("We couldn't find that area on Google Maps. Try adding the neighbourhood and the city.");
    e.userFacing = true;
    throw e;
  }

  // Google's order shifts between identical searches, so run it three times
  // and report the typical position and the range, not one lucky number.
  const search = { kind: "text", query, max: 20, region: "in", fields: FIELDS, bias: { lat: center.latitude, lng: center.longitude, radius: 3000 } };
  const runs = (await placesBatch([search, search, search])).filter((r) => !(r instanceof PlacesError));
  if (!runs.length) throw new PlacesError("Google Maps couldn't process that right now. Try again shortly.", { code: "places_error" });
  const res = runs[0];
  const seen = runs.map((r) => r.findIndex((p) => matches(p, target))).map((i) => (i >= 0 ? i + 1 : null));
  const found = seen.filter(Boolean).sort((x, y) => x - y);
  // Typical = median of the runs where you appeared; null if you appeared in fewer than half.
  const typical = found.length * 2 >= runs.length ? found[Math.floor((found.length - 1) / 2)] : null;

  const list = res.map((p, i) => ({
    position: i + 1,
    name: p.displayName?.text || "Unnamed",
    rating: p.rating ?? null,
    reviews: p.userRatingCount ?? 0,
    category: p.primaryTypeDisplayName?.text || null,
    website: p.websiteUri ? hostOf(p.websiteUri) : null,
    mapsUrl: p.googleMapsUri || null,
    isYou: matches(p, target),
  }));
  const youInRuns = runs.flatMap((r) => r.filter((p) => matches(p, target)))[0];
  const you = list.find((p) => p.isYou) ||
    (youInRuns ? { name: youInRuns.displayName?.text, rating: youInRuns.rating ?? null, reviews: youInRuns.userRatingCount ?? 0 } : null);
  const top3 = list.slice(0, 3);
  const avg = (k) => (top3.length ? top3.reduce((s, p) => s + (p[k] || 0), 0) / top3.length : 0);

  return {
    checkedAt: new Date().toISOString(),
    query,
    matchedBy: looksLikeSite ? "website" : "name",
    position: typical,
    range: found.length ? { best: found[0], worst: found[found.length - 1], seenIn: found.length, runs: runs.length } : null,
    you,
    results: list,
    top3Average: { rating: Math.round(avg("rating") * 10) / 10, reviews: Math.round(avg("reviews")) },
  };
}
