// Google Maps place data, from whichever source is configured.
//
// GOOGLE_PLACES_API_KEY → Google's Places API (New) directly.
// COMPOSIO_API_KEY      → the same Places data via Composio's Google Maps tools.
// Both return Places API (New) field shapes, so everything downstream — the
// GBP rubric, competitor discovery, proposals — is source-agnostic.

import { executeTools, composioConfigured, ComposioError } from "./composio.js";

const BASE = "https://places.googleapis.com/v1";
const TIMEOUT_MS = 15_000;

export class PlacesError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.code = code;
  }
}

export function placesProvider() {
  if (process.env.GOOGLE_PLACES_API_KEY) return "google";
  if (composioConfigured()) return "composio";
  return null;
}

const listMask = (fields) => fields.map((f) => (f.startsWith("places.") ? f : `places.${f}`)).join(",");

function asPlacesError(e) {
  if (e instanceof PlacesError) return e;
  if (e instanceof ComposioError) {
    if (e.code === "bad_key") return new PlacesError("The Google Maps connection rejected our key.", { code: "bad_key" });
    return new PlacesError(`Google Maps data is unavailable right now (${e.message})`, { code: e.code === "truncated" ? "truncated" : "places_error" });
  }
  return new PlacesError("Google Maps couldn't process that right now. Try again shortly.", { code: "places_error" });
}

/**
 * Runs several place lookups together (one round trip on Composio).
 *
 * Request kinds:
 *   { kind: "text", query, max, fields, bias?: {lat, lng, radius} }  → place[]
 *   { kind: "nearby", lat, lng, radius, types?, max, fields }         → place[]
 *   { kind: "details", id, fields }                                   → place
 *
 * Each slot resolves to its data or a PlacesError, so one failed lookup
 * doesn't sink the rest. Throws only when no source is configured or the
 * whole transport fails.
 */
export async function placesBatch(requests) {
  const provider = placesProvider();
  if (!provider) {
    throw new PlacesError("No Google Maps data source is configured.", { code: "not_configured" });
  }
  if (provider === "google") {
    return Promise.all(requests.map((r) => viaGoogle(r).catch(asPlacesError)));
  }
  return viaComposio(requests);
}

// ---------- Google Places API (New) ----------
async function googleFetch(path, { method = "GET", body, mask }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": mask,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 403) throw new PlacesError("Google rejected the Places API key. Check it's enabled for Places API (New) with billing active and not restricted to browser referrers.", { code: "bad_key" });
    if (res.status === 404) throw new PlacesError("That business no longer resolves on Google Maps.", { code: "not_found" });
    // 429 is Google's per-minute quota (e.g. 'GetPlaceRequest per minute'), not a
    // fault — callers retry it with backoff (see googleFetch) and bulk scripts
    // can tell it apart from a real failure.
    if (res.status === 429) throw new PlacesError("Google Places per-minute quota reached (429).", { code: "rate_limited" });
    if (!res.ok) throw new PlacesError(`Google Places returned HTTP ${res.status}.`, { code: res.status >= 500 ? "upstream" : "places_error" });
    return res.json();
  } catch (e) {
    if (e.name === "AbortError") throw new PlacesError("Google Places took too long to respond.", { code: "timeout" });
    // Network-level failures (connection reset under load) — transient.
    if (!(e instanceof PlacesError)) throw new PlacesError(`Network error reaching Google Places (${e.cause?.code || e.message}).`, { code: "network" });
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Retries transient failures (429 / 5xx / network) with backoff so bulk and
// concurrent callers ride out the per-minute quota instead of failing.
const RETRYABLE = new Set(["rate_limited", "upstream", "network", "timeout"]);
async function googleFetchRetry(path, opts) {
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try { return await googleFetch(path, opts); } catch (e) {
      last = e;
      if (!(e instanceof PlacesError) || !RETRYABLE.has(e.code)) throw e;
      await new Promise((r) => setTimeout(r, (e.code === "rate_limited" ? 2500 : 700) * (attempt + 1)));
    }
  }
  throw last;
}

async function viaGoogle(r) {
  if (r.kind === "details") {
    return googleFetchRetry(`/places/${encodeURIComponent(r.id)}`, { mask: r.fields.join(",") });
  }
  if (r.kind === "text") {
    const body = { textQuery: r.query, pageSize: r.max || 10, ...(r.region ? { regionCode: r.region } : {}) };
    if (r.bias) body.locationBias = { circle: { center: { latitude: r.bias.lat, longitude: r.bias.lng }, radius: r.bias.radius } };
    const data = await googleFetchRetry("/places:searchText", { method: "POST", body, mask: listMask(r.fields) });
    return data.places || [];
  }
  if (r.kind === "nearby") {
    const body = {
      maxResultCount: r.max || 10,
      locationRestriction: { circle: { center: { latitude: r.lat, longitude: r.lng }, radius: r.radius } },
      ...(r.types?.length ? { includedTypes: r.types } : {}),
    };
    const data = await googleFetchRetry("/places:searchNearby", { method: "POST", body, mask: listMask(r.fields) });
    return data.places || [];
  }
  throw new PlacesError(`Unknown lookup kind: ${r.kind}`, { code: "bad_request" });
}

// ---------- Composio ----------
function unwrapList(d) {
  if (Array.isArray(d?.places)) return d.places;
  if (Array.isArray(d?.data?.places)) return d.data.places;
  return []; // Google returns {} when nothing matches
}

function unwrapPlace(d) {
  if (d?.id) return d;
  if (d?.data?.id) return d.data;
  if (d?.place?.id) return d.place;
  return new PlacesError("Google Maps returned no details for that place.", { code: "not_found" });
}

async function viaComposio(requests) {
  const calls = requests.map((r) => {
    if (r.kind === "details") {
      return { slug: "GOOGLE_MAPS_GET_PLACE_DETAILS", args: { name: `places/${r.id}`, fieldMask: r.fields.join(",") } };
    }
    if (r.kind === "text") {
      // Composio's text search takes no location bias — callers that care
      // about proximity filter by distance themselves.
      return { slug: "GOOGLE_MAPS_TEXT_SEARCH", args: { textQuery: r.query, maxResultCount: r.max || 10, fieldMask: listMask(r.fields) } };
    }
    return {
      slug: "GOOGLE_MAPS_NEARBY_SEARCH",
      args: {
        latitude: r.lat,
        longitude: r.lng,
        radius: r.radius,
        maxResultCount: r.max || 10,
        fieldMask: listMask(r.fields),
        ...(r.types?.length ? { includedTypes: r.types } : {}),
      },
    };
  });

  // One Composio call per lookup, in parallel. Composio caps the size of a
  // single response, so batching a big competitor search with anything else
  // can push the whole batch over the limit and lose every result.
  const settled = await Promise.allSettled(calls.map((c) => executeTools([c])));

  // If every call failed the same way at the transport level, surface that.
  if (settled.every((s) => s.status === "rejected")) throw asPlacesError(settled[0].reason);

  return settled.map((s, i) => {
    if (s.status === "rejected") return asPlacesError(s.reason);
    const res = s.value[0];
    if (res instanceof Error) return asPlacesError(res);
    return requests[i].kind === "details" ? unwrapPlace(res) : unwrapList(res);
  });
}

export function distanceMeters(a, b) {
  if (!a || !b || a.latitude == null || b.latitude == null) return null;
  const R = 6_371_000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
