// Visibility tracking: what a client's customers see, measured every week.
//
//   Local search grid — for each keyword, Google Maps rank from a grid of
//     points around the business (each search biased to that point), matched
//     on the business's Google place ID, not its name.
//   AI visibility — whether Gemini (Google Search grounded) and, when an
//     OpenAI key is set, ChatGPT (web search) name the business per keyword.
//   Reviews — rating and count over time, plus the reviews Google returns
//     (at most 5, chosen by relevance, not recency).
//
// Grid searches request IDs only (the cheapest Places tier). A 5x5 grid with
// 3 keywords is 75 searches per client per week.

import { get, set } from "./store";
import { placesBatch, PlacesError } from "./places";
import { resolvePlace } from "./gbp-audit";
import { aiAnswerCheck, aiAnswerConfigured, chatgptAnswerCheck, chatgptConfigured } from "./ai-answer";
import { listClients } from "./clients";

const cfgKey = (id) => `track:config:${id}`;
const snapKey = (id) => `track:snaps:${id}`;
const KEEP = 26; // about six months of weekly snapshots
const WEEK_MS = 7 * 86_400_000;
export const MAX_KEYWORDS = 5;
export const GRID_SIZES = [3, 5, 7];

export async function getTrackConfig(id) {
  return (await get(cfgKey(id))) || { keywords: [], grid: 5, spacingKm: 1 };
}

export async function setTrackConfig(id, { keywords, grid, spacingKm }) {
  const clean = {
    keywords: [...new Set((Array.isArray(keywords) ? keywords : String(keywords || "").split(/[\n,]/))
      .map((k) => String(k).trim().toLowerCase().slice(0, 80)).filter((k) => k.length >= 3))].slice(0, MAX_KEYWORDS),
    grid: GRID_SIZES.includes(Number(grid)) ? Number(grid) : 5,
    spacingKm: Math.min(5, Math.max(0.3, Number(spacingKm) || 1)),
  };
  await set(cfgKey(id), clean);
  return clean;
}

export async function listSnapshots(id) {
  return (await get(snapKey(id))) || [];
}

// N x N points centred on the business, `spacingKm` apart.
export function gridPoints(center, size, spacingKm) {
  const half = (size - 1) / 2;
  const dLat = spacingKm / 111.32;
  const dLng = spacingKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  const pts = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) pts.push({ lat: +(center.lat + (half - r) * dLat).toFixed(6), lng: +(center.lng + (c - half) * dLng).toFixed(6) });
  return pts;
}

const areaOf = (place) => {
  const comps = place.addressComponents || [];
  const pick = (t) => comps.find((c) => (c.types || []).includes(t))?.longText;
  return [pick("sublocality_level_1") || pick("sublocality") || pick("neighborhood"), pick("locality")].filter(Boolean).join(", ");
};

// Summary numbers for one keyword's grid. Not found = outside the top 20.
export function gridStats(ranks) {
  const found = ranks.filter((r) => r != null);
  const n = ranks.length || 1;
  return {
    found: found.length,
    top3Share: Math.round((ranks.filter((r) => r != null && r <= 3).length / n) * 100),
    avgRank: found.length ? Math.round((found.reduce((a, b) => a + b, 0) / found.length) * 10) / 10 : null,
    centerRank: ranks[Math.floor(ranks.length / 2)] ?? null,
  };
}

async function inChunks(requests, size = 25) {
  const out = [];
  for (let i = 0; i < requests.length; i += size) out.push(...(await placesBatch(requests.slice(i, i + size))));
  return out;
}

/** Runs one tracking snapshot for a client and stores it. */
export async function runTracking(client) {
  const snap = await measureTracking(client, await getTrackConfig(client.id));
  await set(snapKey(client.id), [snap, ...(await listSnapshots(client.id))].slice(0, KEEP));
  return snap;
}

/** Takes the measurements without storing them. */
export async function measureTracking(client, cfg) {
  if (!cfg.keywords.length) throw Object.assign(new Error("Add at least one keyword to track first."), { code: "no_keywords" });
  const input = client.gbpLink || [client.name, client.city].filter(Boolean).join(", ");
  const { place } = await resolvePlace(input);
  const center = { lat: place.location.latitude, lng: place.location.longitude };
  const points = gridPoints(center, cfg.grid, cfg.spacingKm);
  const radius = Math.round(cfg.spacingKm * 600);

  const requests = cfg.keywords.flatMap((kw) => points.map((p) => ({ kind: "text", query: kw, max: 20, fields: ["id"], bias: { lat: p.lat, lng: p.lng, radius } })));
  const area = areaOf(place) || client.city || "";
  const business = place.displayName?.text || client.name;
  const engines = [
    aiAnswerConfigured() && ["gemini", aiAnswerCheck],
    chatgptConfigured() && ["chatgpt", chatgptAnswerCheck],
  ].filter(Boolean);
  const [results, ai] = await Promise.all([
    inChunks(requests),
    Promise.all(engines.flatMap(([engine, check]) => cfg.keywords.slice(0, 3).map((kw) => check({ business, keyword: kw, area })
      .then((r) => ({ engine, keyword: kw, mentioned: r.mentioned, question: r.question, sources: r.sources.slice(0, 5), grounded: r.grounded }))
      .catch((e) => ({ engine, keyword: kw, error: e.message }))))),
  ]);

  let failed = 0;
  const keywords = cfg.keywords.map((kw, k) => {
    const ranks = points.map((_, i) => {
      const r = results[k * points.length + i];
      if (r instanceof PlacesError || !Array.isArray(r)) { failed++; return null; }
      const pos = r.findIndex((x) => x.id === place.id);
      return pos >= 0 ? pos + 1 : null;
    });
    return { keyword: kw, ranks, ...gridStats(ranks) };
  });
  if (failed > requests.length / 2) throw new Error(`Google Maps searches failed (${failed} of ${requests.length}). Nothing was saved; try again later.`);

  const snap = {
    at: new Date().toISOString(),
    place: { id: place.id, name: place.displayName?.text || client.name, area },
    grid: { size: cfg.grid, spacingKm: cfg.spacingKm, center, points },
    keywords,
    failedSearches: failed,
    ai,
    reviews: {
      rating: place.rating ?? null,
      count: place.userRatingCount ?? 0,
      latest: (place.reviews || []).slice(0, 5).map((r) => ({
        author: r.authorAttribution?.displayName || "A customer",
        rating: r.rating ?? null,
        text: String(r.text?.text || r.originalText?.text || "").slice(0, 600),
        when: r.relativePublishTimeDescription || null,
        at: r.publishTime || null,
      })),
    },
    nap: { name: place.displayName?.text || "", address: place.formattedAddress || "", phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "", website: place.websiteUri || "" },
  };
  return snap;
}

/** Active clients with keywords whose last snapshot is a week old or more. */
export async function dueForTracking(now = Date.now()) {
  const out = [];
  for (const c of await listClients()) {
    if (c.status !== "active") continue;
    if (!(await getTrackConfig(c.id)).keywords.length) continue;
    const last = (await listSnapshots(c.id))[0];
    if (!last || now - Date.parse(last.at) >= WEEK_MS - 3_600_000) out.push(c);
  }
  return out;
}
