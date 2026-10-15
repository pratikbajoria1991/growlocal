// Keyword ideas from Google's own autocomplete: the searches real people
// start typing. Free and live, but autocomplete gives no search volumes, so
// results are grouped by intent rather than ranked by traffic.

const SUGGEST = "https://suggestqueries.google.com/complete/search";
const TIMEOUT_MS = 5000;
const CONCURRENCY = 6;

const QUESTION = /^(how|what|which|why|when|where|who|can|is|are|does|do|should|will)\b/;
const COMMERCIAL = /\b(best|top|price|prices|cost|charges|fees|cheap|affordable|rate|rates|review|reviews|vs|near me|open now|book|appointment)\b/;

async function suggest(q, gl) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${SUGGEST}?client=firefox&hl=en&gl=${gl}&q=${encodeURIComponent(q)}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; GrowlocalBot/1.0)" },
    });
    if (!res.ok) return null;
    const data = JSON.parse(await res.text());
    return Array.isArray(data?.[1]) ? data[1].map((s) => String(s).toLowerCase().trim()) : [];
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n]);
      }
    })
  );
  return out;
}

/**
 * @param {{seed:string, area?:string, country?:string}} input
 * @returns {Promise<{seed, area, total, groups:{questions,local,commercial,other}, failed:number}>}
 */
export async function keywordIdeas({ seed, area = "", country = "in" }) {
  const s = seed.toLowerCase().replace(/\s+/g, " ").trim();
  const a = area.toLowerCase().replace(/\s+/g, " ").trim();
  const gl = /^[a-z]{2}$/.test(country) ? country : "in";

  const queries = [
    s,
    `${s} near me`,
    `best ${s}`,
    `${s} price`,
    ...["how", "what", "which", "why", "can", "is"].map((w) => `${w} ${s}`),
    ...(a ? [`${s} in ${a}`, `${s} ${a}`, `best ${s} in ${a}`] : []),
    ..."abcdefghijklmnopqrstuvwxyz".split("").map((c) => `${s} ${c}`),
  ];

  const results = await pool(queries, (q) => suggest(q, gl));
  const failed = results.filter((r) => r === null).length;
  if (failed === queries.length) {
    const e = new Error("Google suggestions are unavailable right now. Try again in a few minutes.");
    e.userFacing = true;
    throw e;
  }

  const seen = new Set([s]);
  const groups = { questions: [], local: [], commercial: [], other: [] };
  for (const list of results) {
    for (const k of list || []) {
      if (!k || seen.has(k) || k.length > 90) continue;
      seen.add(k);
      if (QUESTION.test(k)) groups.questions.push(k);
      else if (/near me/.test(k) || (a && k.includes(a))) groups.local.push(k);
      else if (COMMERCIAL.test(k)) groups.commercial.push(k);
      else groups.other.push(k);
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    seed: s,
    area: a,
    total: seen.size - 1,
    groups,
    failed,
  };
}
