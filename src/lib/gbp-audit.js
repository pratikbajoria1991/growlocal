// Growlocal Google Business Profile auditor.
// Given a Google Maps / GBP share link, resolves the real, live listing via
// Google's Places data and scores it out of 100 — the actual profile a
// customer sees, not just what a website claims about it.
//
// Data comes from src/lib/places.js: Google's Places API directly when
// GOOGLE_PLACES_API_KEY is set, otherwise Composio's Google Maps tools via
// COMPOSIO_API_KEY. With neither, this throws a clear "not configured" error
// rather than inventing a listing — we never fabricate GBP data.

import { placesBatch, placesProvider, distanceMeters } from "./places";

const TIMEOUT_MS = 10_000;

class GbpAuditError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.code = code;
  }
}

async function withTimeout(fn) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

// ---------- link parsing ----------
// Google Maps share links come in at least five shapes. We try to pull a
// business name and/or coordinates out of whichever one we're handed, then
// let the Places API do the actual resolution — we never scrape Maps HTML.
const SHORT_LINK_HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|g\.page)$/i;

async function expandShortLink(url) {
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; GrowlocalBot/1.0; +https://growlocal.vercel.app/audit)" },
      });
      return res.url || url;
    });
  } catch {
    return url;
  }
}

function extractFromMapsUrl(url) {
  let name = null;
  let lat = null;
  let lng = null;
  let placeId = null;

  try {
    const u = new URL(url);
    placeId = u.searchParams.get("place_id") || u.searchParams.get("query_place_id");

    const placeMatch = u.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));

    // Precise marker coords beat the viewport-center @lat,lng when both exist.
    const precise = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    const viewport = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const coords = precise || viewport;
    if (coords) { lat = parseFloat(coords[1]); lng = parseFloat(coords[2]); }

    if (!name) {
      const q = u.searchParams.get("q");
      if (q && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(q)) name = q;
    }
  } catch { /* not a parseable URL — handled by caller */ }

  return { name, lat, lng, placeId };
}

async function parseGbpInput(raw) {
  const input = String(raw || "").trim();
  if (!input) throw new GbpAuditError("Paste a Google Maps or Business Profile link.", { code: "empty" });

  const looksLikeUrl = /^https?:\/\//i.test(input) || /^(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page)/i.test(input);

  if (!looksLikeUrl) {
    // Not a link at all — treat the whole string as a business name/query.
    return { name: input, lat: null, lng: null, placeId: null };
  }

  let url = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let host;
  try { host = new URL(url).hostname; } catch {
    throw new GbpAuditError("That doesn't look like a valid Google Maps link.", { code: "bad_url" });
  }

  if (SHORT_LINK_HOSTS.test(host)) url = await expandShortLink(url);

  const parsed = extractFromMapsUrl(url);
  if (!parsed.name && !parsed.placeId && !(parsed.lat && parsed.lng)) {
    throw new GbpAuditError(
      "Couldn't read a business from that link. Open the listing in Google Maps, use Share → Copy link, and paste that.",
      { code: "unparseable" }
    );
  }
  return parsed;
}

// ---------- place lookup ----------
const toAuditError = (e) => new GbpAuditError(e.message, { code: e.code });

async function findPlaceId({ name, lat, lng }) {
  const [found] = await placesBatch([{
    kind: "text",
    query: name || "business",
    max: 5,
    fields: ["id", "displayName", "formattedAddress", "location"],
    bias: lat && lng ? { lat, lng, radius: 300 } : null,
  }]);
  if (found instanceof Error) throw toAuditError(found);
  if (!found.length) return null;

  // Composio's search can't bias by location, so when the link carried
  // coordinates, pick the match actually at that spot — not a same-named
  // branch across town.
  if (lat && lng) {
    const origin = { latitude: lat, longitude: lng };
    const nearest = found
      .map((p) => ({ id: p.id, d: distanceMeters(origin, p.location) }))
      .filter((p) => p.d != null)
      .sort((a, b) => a.d - b.d)[0];
    if (nearest && nearest.d <= 2000) return nearest.id;
  }
  return found[0].id;
}

export const DETAIL_FIELDS = [
  "id", "displayName", "primaryType", "primaryTypeDisplayName", "types",
  "formattedAddress", "addressComponents", "location", "nationalPhoneNumber",
  "internationalPhoneNumber", "websiteUri", "regularOpeningHours", "rating",
  "userRatingCount", "businessStatus", "photos", "reviews", "googleMapsUri", "editorialSummary",
];

/**
 * Resolves a Maps link or "business name, area" string to a full live place.
 * Shared by the GBP audit and the proposal generator.
 */
export async function resolvePlace(rawInput) {
  if (!placesProvider()) {
    throw new GbpAuditError(
      "GBP profile audits aren't switched on yet — this needs a Google Maps data source configured on the server. The website audit (URL / HTML / Text tabs) works right now with no setup.",
      { code: "not_configured" }
    );
  }

  const parsed = await parseGbpInput(rawInput);
  const placeId = parsed.placeId || await findPlaceId(parsed);
  if (!placeId) {
    throw new GbpAuditError(
      "Couldn't find that business on Google Maps. Double-check the link, or make sure the name is spelled the way it appears on the profile.",
      { code: "not_found" }
    );
  }

  const [place] = await placesBatch([{ kind: "details", id: placeId, fields: DETAIL_FIELDS }]);
  if (place instanceof Error) throw toAuditError(place);
  return { place, parsed };
}

// ---------- check builder ----------
// Same shape as the website auditor's check(), plus an optional `losing`
// string — the cost of leaving that specific gap unfixed, shown only for
// failing checks so we're never inventing a loss for something that passed.
const check = (id, label, earned, max, fix = null, losing = null) => ({
  id, label, points: earned, max, pass: earned >= max, partial: earned > 0 && earned < max,
  fix: earned < max ? fix : null,
  losing: earned < max ? losing : null,
});

const COMPLETE_PROFILE_STAT =
  "Businesses with a fully complete Google Business Profile are 2.7× more likely to be seen as reputable and get roughly 70% more location visits than incomplete ones (Google's own Business Profile performance data, widely republished by local-SEO researchers).";
const CLICKS_STAT =
  "Accurate, fully filled-out listings get about 7× more clicks in Google's local results than incomplete ones.";

// ============ scoring (100) ============
function scoreGbpProfile(place) {
  const c = [];

  // Operational status (6)
  const status = place.businessStatus || "OPERATIONAL";
  if (status === "OPERATIONAL") c.push(check("gbp_status", "Listed as open and operational", 6, 6));
  else c.push(check("gbp_status", `Marked "${status.replace(/_/g, " ").toLowerCase()}" on Google`, 0, 6,
    `Update your status in Google Business Profile manager — a listing marked closed is invisible in local search and the Maps app, even if you're open.`,
    `Right now Google is actively telling searchers you're closed. That's not a ranking problem — it's a "we can't buy from you today" problem. Every search this status is live for is a lost customer, full stop.`));

  // Category specificity (8)
  const generic = new Set(["point_of_interest", "establishment"]);
  const primaryType = place.primaryType;
  if (primaryType && !generic.has(primaryType)) {
    c.push(check("gbp_category", `Primary category set: ${place.primaryTypeDisplayName?.text || primaryType}`, 8, 8));
  } else {
    c.push(check("gbp_category", "No specific business category set", 0, 8,
      `Set a specific primary category in Google Business Profile — "Dentist" or "Italian Restaurant", not "Business". Category is one of the strongest signals Google uses to match you to a search.`,
      `Without a specific category, Google can't confidently match you to category-based searches ("dentist near me") — you're competing on name recognition alone against competitors who show up automatically.`));
  }

  // Website linked (10)
  if (place.websiteUri) c.push(check("gbp_website", "Website link present", 10, 10));
  else c.push(check("gbp_website", "No website linked", 0, 10,
    `Add your website URL in the "Website" field of your profile. It's a free, high-intent click straight from the map pack.`,
    `Every searcher who wants more than the map pack gives you — menu, pricing, portfolio — hits a dead end and calls a competitor whose website link works instead.`));

  // Phone listed (8)
  if (place.nationalPhoneNumber) c.push(check("gbp_phone", "Phone number listed", 8, 8));
  else c.push(check("gbp_phone", "No phone number listed", 0, 8,
    `Add a phone number in your profile. This powers the tap-to-call button, which is the single most-used action on mobile local search.`,
    `No phone number means no tap-to-call button — the fastest path from "found you" to "booked" simply isn't there for mobile searchers, who are the majority of local search traffic.`));

  // Structured address (8)
  if (place.formattedAddress && place.formattedAddress.split(",").length >= 3) {
    c.push(check("gbp_address", "Full address on file", 8, 8));
  } else {
    c.push(check("gbp_address", "Address is missing or incomplete", 0, 8,
      `Complete your address in Google Business Profile — street, locality, state and postal code. An incomplete address blocks accurate map placement and driving directions.`,
      `${COMPLETE_PROFILE_STAT}`));
  }

  // Hours published (10)
  if (place.regularOpeningHours?.periods?.length > 0) c.push(check("gbp_hours", "Opening hours published", 10, 10));
  else c.push(check("gbp_hours", "No opening hours published", 0, 10,
    `Add your weekly hours in Google Business Profile. This unlocks the "Open now" / "Closes soon" label, one of the most-used local search filters.`,
    `Without hours, you're invisible to anyone who filters by "Open now" — and everyone else has to guess whether it's worth the trip, so many just won't try.`));

  // Rating quality (14)
  const rating = place.rating || 0;
  if (rating >= 4.5) c.push(check("gbp_rating", `${rating.toFixed(1)}★ average rating`, 14, 14));
  else if (rating >= 4.0) c.push(check("gbp_rating", `${rating.toFixed(1)}★ average rating`, 10, 14,
    `Ask happy customers directly for a review right after a good experience — a QR code at checkout or a follow-up SMS both work. Aim for 4.5+.`,
    `A rating in the low 4s reads as "fine" next to a competitor's 4.8 — and in the map pack, where all the options sit inches apart, "fine" loses to "great" almost every time.`));
  else if (rating > 0) c.push(check("gbp_rating", `${rating.toFixed(1)}★ average rating`, 4, 14,
    `Address the pattern behind low ratings first — read the last 10 reviews for a real, fixable complaint. Then actively request reviews from satisfied customers to shift the average.`,
    `A rating under 4.0 is one of the strongest "skip this one" signals a searcher uses — it filters you out before they've even read a single review's text.`));
  else c.push(check("gbp_rating", "No rating yet", 0, 14,
    `Get your first reviews. Ask your last 10-15 customers directly with a link to your review page — most will leave one if asked at the right moment.`,
    `A listing with no rating shows a blank star row next to competitors' scores — searchers read "untested" as a reason to pick someone else, not a neutral.`));

  // Review volume (16)
  const count = place.userRatingCount || 0;
  if (count >= 100) c.push(check("gbp_review_volume", `${count} reviews`, 16, 16));
  else if (count >= 50) c.push(check("gbp_review_volume", `${count} reviews`, 12, 16,
    `Keep requesting reviews steadily — you're past the credibility threshold but volume still separates you from category leaders.`,
    null));
  else if (count >= 20) c.push(check("gbp_review_volume", `${count} reviews`, 8, 16,
    `Build a habit of asking every satisfied customer for a review — automate it via SMS/WhatsApp after each job or visit if you can.`,
    `${count} reviews looks thin next to competitors sitting at 100+ in the same map pack — review count is a trust shortcut people use before reading a single word of what anyone wrote.`));
  else if (count >= 5) c.push(check("gbp_review_volume", `${count} reviews`, 4, 16,
    `You need volume, not just quality. Ask every customer, every time — the businesses winning the map pack usually aren't better, they just asked more consistently.`,
    `With only ${count} reviews, one bad experience can swing your entire average — and searchers default to whichever nearby competitor has the deeper track record.`));
  else c.push(check("gbp_review_volume", count === 0 ? "No reviews" : `Only ${count} review${count === 1 ? "" : "s"}`, 0, 16,
    `Start asking for reviews today — every completed sale or appointment is a chance. A simple "would you leave us a quick Google review?" converts more often than you'd expect.`,
    `${CLICKS_STAT}`));

  // Review recency (8) — heuristic from the up-to-5 reviews the API returns.
  const reviews = place.reviews || [];
  if (reviews.length === 0) {
    c.push(check("gbp_review_recency", "No recent reviews to check", 0, 8,
      `Once you have reviews coming in regularly, this resolves itself. A steady trickle beats a burst that goes quiet.`,
      `A profile with old or no reviews reads as "maybe this business closed" to anyone scanning dates — recency is its own trust signal, separate from the star average.`));
  } else {
    const days = (iso) => (Date.now() - new Date(iso).getTime()) / 86_400_000;
    const newest = Math.min(...reviews.map((r) => days(r.publishTime)));
    if (newest <= 90) c.push(check("gbp_review_recency", "Recent reviews within the last 90 days", 8, 8));
    else if (newest <= 180) c.push(check("gbp_review_recency", "Most recent review is 3-6 months old", 5, 8,
      `Ask your next handful of customers for a review to keep the timeline fresh — Google and searchers both read a recent date as "this business is active."`,
      null));
    else c.push(check("gbp_review_recency", "No reviews in the last 6+ months", 0, 8,
      `Restart the habit — ask your next few satisfied customers directly. A visible gap in dates reads as decline even if business is fine.`,
      `A stale review timeline sits right next to competitors' recent ones in the same list — it quietly signals "this place may not be what it used to be," whether or not that's true.`));
  }

  // Photo coverage (12)
  const photoCount = (place.photos || []).length;
  if (photoCount >= 10) c.push(check("gbp_photos", `${photoCount}+ photos on the profile`, 12, 12));
  else if (photoCount >= 3) c.push(check("gbp_photos", `${photoCount} photos on the profile`, 7, 12,
    `Add more real photos — interior, exterior, team, product/work examples. Profiles with 10+ photos consistently out-convert thinner ones.`,
    null));
  else if (photoCount >= 1) c.push(check("gbp_photos", `Only ${photoCount} photo${photoCount === 1 ? "" : "s"}`, 3, 12,
    `Upload at least 10 photos: storefront, interior, team, and your actual work or product. This is one of the fastest, cheapest fixes on this whole list.`,
    `With almost no photos, searchers fall back to whatever Google's generic street-view thumbnail shows — or a competitor's real photos right next to it. People judge trust visually before they read a word.`));
  else c.push(check("gbp_photos", "No photos on the profile", 0, 12,
    `Upload photos today — even phone photos of your storefront, team and work beat having none. This is the single fastest fix on this list.`,
    `A listing with zero photos is the first thing a searcher's eye skips past in the map pack. It costs nothing to fix and is currently costing you clicks for free.`));

  const earned = c.reduce((s, x) => s + x.points, 0);
  const max = c.reduce((s, x) => s + x.max, 0);

  return {
    score: Math.round((earned / max) * 100),
    earned,
    max,
    checks: c,
    passing: c.filter((x) => x.pass).length,
    failing: c.filter((x) => !x.pass).length,
  };
}

// What the Places API cannot tell us, disclosed honestly rather than
// silently omitted or guessed at.
export const GBP_NOT_ASSESSED = [
  "Whether you're replying to reviews — the API doesn't expose reply status or content",
  "Posts / updates / offers activity on your profile",
  "Questions & Answers activity",
  "Messaging or booking button configuration",
  "How complete your services or products list is",
  "How recently your photos were actually uploaded (only the count is available)",
];

// ---------- main ----------
export async function runGbpAudit(rawLink) {
  const { place, parsed } = await resolvePlace(rawLink);
  return buildGbpResult(place, { fallbackUrl: rawLink, fallbackName: parsed.name });
}

/**
 * Scores an ALREADY-FETCHED Places payload.
 *
 * Deliberately separate from runGbpAudit so the scoring rubric doesn't care
 * where the data came from — the Places API directly, a Composio Google Maps
 * connection, or a fixture in a test. Same rubric, same output shape, so a
 * profile scored by hand today and by the product tomorrow gets the same number.
 *
 * Expects the Places API (New) field shape: displayName.text, businessStatus,
 * primaryType, formattedAddress, nationalPhoneNumber, websiteUri,
 * regularOpeningHours.periods, rating, userRatingCount, photos[], reviews[].
 */
export function buildGbpResult(place, { fallbackUrl = "", fallbackName = "" } = {}) {
  if (!place || typeof place !== "object") {
    throw new GbpAuditError("No profile data to score.", { code: "no_data" });
  }

  if (place.businessStatus === "CLOSED_PERMANENTLY") {
    throw new GbpAuditError(
      `Google shows "${place.displayName?.text || "this listing"}" as permanently closed. There's no profile left to optimise — if this is wrong, request reinstatement in Google Business Profile manager first.`,
      { code: "closed" }
    );
  }

  const gbp = scoreGbpProfile(place);

  const priorities = gbp.checks
    .filter((x) => !x.pass && x.fix)
    .map((x) => ({ ...x, category: "GBP", recoverable: x.max - x.points }))
    .sort((a, b) => b.recoverable - a.recoverable)
    .slice(0, 5);

  const whatYoureLosing = gbp.checks.filter((x) => !x.pass && x.losing);

  return {
    url: place.googleMapsUri || fallbackUrl,
    source: "gbp",
    mode: "gbp",
    place: {
      name: place.displayName?.text || fallbackName || "This business",
      address: place.formattedAddress || null,
      rating: place.rating || null,
      userRatingCount: place.userRatingCount || 0,
      mapsUri: place.googleMapsUri || null,
    },
    truncated: false,
    overall: gbp.score,
    grade: gbp.score >= 85 ? "A" : gbp.score >= 70 ? "B" : gbp.score >= 55 ? "C" : gbp.score >= 40 ? "D" : "F",
    scores: { GBP: gbp },
    priorities,
    whatYoureLosing,
    notAssessed: GBP_NOT_ASSESSED,
    schemaTypes: [],
    auditedAt: new Date().toISOString(),
  };
}

export { GbpAuditError, scoreGbpProfile };
