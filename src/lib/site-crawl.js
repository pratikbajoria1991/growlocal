// Multi-page site audit: crawls up to MAX_PAGES pages of one site and
// reports page-level and cross-page issues (duplicates, broken internal
// links, redirect chains).
//
// The issue set follows OpenSEO's site audit (github.com/every-app/open-seo,
// MIT licence), reimplemented here for a single synchronous run with no
// database: everything happens inside one request.

import { createHash } from "node:crypto";
import { safeFetch } from "./safe-fetch.js";

const MAX_PAGES = 25;
const CONCURRENCY = 4;
const BUDGET_MS = 40_000;
const SLOW_MS = 2_000;

const ISSUES = {
  "broken-page": { label: "Page returns an error (4xx)", severity: "high", fix: "Fix or redirect the URL, and update every link that points to it." },
  "server-error": { label: "Server error (5xx)", severity: "high", fix: "Check your hosting logs. Google stops crawling pages that keep failing." },
  "broken-link": { label: "Links to a broken page", severity: "high", fix: "Point these links at a working page or remove them." },
  "noindex-page": { label: "Hidden from Google (noindex)", severity: "high", fix: "Remove the noindex tag if this page should appear in search." },
  "missing-title": { label: "Missing title tag", severity: "high", fix: "Add a unique <title> of 30 to 60 characters naming the service and area." },
  "missing-h1": { label: "Missing H1 heading", severity: "medium", fix: "Add one H1 that says what the page is about." },
  "duplicate-title": { label: "Same title as another page", severity: "medium", fix: "Give every page its own title so Google can tell them apart." },
  "missing-meta-description": { label: "Missing meta description", severity: "medium", fix: "Write a 70 to 160 character summary that makes people want to click." },
  "duplicate-meta-description": { label: "Same description as another page", severity: "low", fix: "Write a description specific to each page." },
  "duplicate-content": { label: "Duplicate page content", severity: "medium", fix: "Merge the pages, or add a canonical tag pointing at the main one." },
  "thin-content": { label: "Thin content (under 200 words)", severity: "medium", fix: "Add useful detail: services, prices, areas served, and answers to common questions." },
  "multiple-h1": { label: "More than one H1", severity: "low", fix: "Keep a single H1 and turn the others into H2s." },
  "title-too-long": { label: "Title over 60 characters", severity: "low", fix: "Shorten it so Google doesn't cut it off." },
  "title-too-short": { label: "Title under 30 characters", severity: "low", fix: "Add the service and the area to the title." },
  "meta-description-too-long": { label: "Description over 160 characters", severity: "low", fix: "Trim it so the end isn't cut off in results." },
  "meta-description-too-short": { label: "Description under 70 characters", severity: "low", fix: "Expand it into a full sentence about the page." },
  "images-missing-alt": { label: "Images without alt text", severity: "low", fix: "Describe each image in its alt attribute for accessibility and image search." },
  "heading-order-skip": { label: "Headings skip a level", severity: "low", fix: "Go H1, H2, H3 in order so the structure is clear to readers and AI." },
  "redirect-chain": { label: "Redirect chain (2+ hops)", severity: "low", fix: "Link straight to the final URL." },
  "canonicalized-page": { label: "Points its canonical elsewhere", severity: "info", fix: "Fine if intended. Otherwise set the canonical to the page itself." },
  "slow-response": { label: "Slow server response (over 2s)", severity: "medium", fix: "Check hosting, caching and page weight." },
  "no-outgoing-links": { label: "No links to other pages", severity: "low", fix: "Link to related pages so visitors and crawlers can move on." },
};

const WEIGHT = { high: 6, medium: 3, low: 1, info: 0 };

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "").trim() : null;
};

function normalizeUrl(href, base) {
  try {
    const u = new URL(href, base);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = "";
    if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.href;
  } catch {
    return null;
  }
}

const sameSite = (a, b) => a.replace(/^www\./, "") === b.replace(/^www\./, "");
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|docx?|xlsx?|pptx?|css|js|ico|xml|txt)$/i;

function analyze(html, pageUrl) {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || html;
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim() || null;
  const metaTags = head.match(/<meta\b[^>]*>/gi) || [];
  const metaNamed = (n) => {
    const t = metaTags.find((m) => (attr(m, "name") || "").toLowerCase() === n);
    return t ? attr(t, "content") : null;
  };
  const description = metaNamed("description") || null;
  const robots = (metaNamed("robots") || "").toLowerCase();
  const canonicalTag = (head.match(/<link\b[^>]*>/gi) || []).find((l) => (attr(l, "rel") || "").toLowerCase() === "canonical");
  const canonical = canonicalTag ? normalizeUrl(attr(canonicalTag, "href") || "", pageUrl) : null;

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const headings = [...body.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  let skip = false;
  for (let i = 1; i < headings.length; i++) if (headings[i] > headings[i - 1] + 1) skip = true;

  const imgs = body.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter((t) => attr(t, "alt") === null).length;

  const text = decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;

  const host = new URL(pageUrl).hostname;
  const internal = new Set();
  let external = 0;
  for (const m of body.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (!href || /^(mailto|tel|javascript):/i.test(href)) continue;
    const u = normalizeUrl(href, pageUrl);
    if (!u) continue;
    if (sameSite(new URL(u).hostname, host)) {
      if (u !== pageUrl) internal.add(u);
    } else external++;
  }

  return {
    title,
    description,
    h1: headings.filter((h) => h === 1).length,
    headingSkip: skip,
    images: imgs.length,
    imagesNoAlt: noAlt,
    noindex: /noindex/.test(robots),
    canonical,
    words,
    contentHash: words > 0 ? createHash("sha1").update(text.toLowerCase()).digest("hex") : null,
    internal: [...internal],
    external,
  };
}

async function sitemapUrls(origin, host) {
  const urls = new Set();
  const candidates = [];
  const robots = await safeFetch(`${origin}/robots.txt`, { timeoutMs: 5000, maxBytes: 200_000, accept: "text/plain" }).catch(() => null);
  if (robots?.ok) for (const m of robots.body.matchAll(/^\s*sitemap:\s*(\S+)/gim)) candidates.push(m[1]);
  if (!candidates.length) candidates.push(`${origin}/sitemap.xml`);

  const seen = new Set();
  let fetched = 0;
  while (candidates.length && fetched < 4 && urls.size < 200) {
    const sm = candidates.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    fetched++;
    const r = await safeFetch(sm, { timeoutMs: 6000, maxBytes: 2_000_000, accept: "application/xml,text/xml" }).catch(() => null);
    if (!r?.ok) continue;
    const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
    if (/<sitemapindex/i.test(r.body)) candidates.push(...locs);
    else for (const l of locs) {
      const u = normalizeUrl(l, origin);
      if (u && sameSite(new URL(u).hostname, host)) urls.add(u);
    }
  }
  return { urls: [...urls], robotsTxt: Boolean(robots?.ok), sitemapFound: seen.size > 0 && urls.size > 0 };
}

/**
 * Crawl a site and return its issues.
 * @returns {Promise<{site, pages, issues, score, summary}>}
 */
export async function crawlSite(rawUrl) {
  const started = Date.now();
  const first = await safeFetch(rawUrl, { timeoutMs: 10_000 });
  if (!first.ok && !first.body) {
    const err = new Error(first.timedOut ? "Your site took too long to respond." : `We couldn't open that site (HTTP ${first.status || "no response"}).`);
    err.userFacing = true;
    throw err;
  }
  const start = new URL(first.url);
  const host = start.hostname;
  const origin = start.origin;
  const sm = await sitemapUrls(origin, host);

  const queue = [normalizeUrl(first.url, origin)];
  const queued = new Set(queue);
  const enqueue = (u) => {
    if (!u || queued.has(u) || SKIP_EXT.test(new URL(u).pathname)) return;
    if (!sameSite(new URL(u).hostname, host)) return;
    queued.add(u);
    queue.push(u);
  };
  for (const u of sm.urls.slice(0, MAX_PAGES * 2)) enqueue(u);

  const pages = new Map();
  const firstUrl = queue[0];

  async function visit(url) {
    let res = first;
    let ms = null; // the homepage fetch also resolved redirects, so its time isn't comparable
    if (url !== firstUrl) {
      const t0 = Date.now();
      res = await safeFetch(url, { timeoutMs: 8000 }).catch(() => ({ ok: false, status: 0, body: "", url, redirects: [] }));
      ms = Date.now() - t0;
    }
    const isHtml = !res.headers || /html/i.test(res.headers.get("content-type") || "text/html");
    const page = { url, finalUrl: res.url, status: res.status, ms, redirects: res.redirects?.length || 0, timedOut: Boolean(res.timedOut) };
    if (res.ok && isHtml && res.body) {
      Object.assign(page, analyze(res.body, res.url));
      for (const l of page.internal) if (queued.size < MAX_PAGES * 3) enqueue(l);
    }
    pages.set(url, page);
  }

  // Workers pull from a queue that grows as pages are read, so an idle
  // worker waits while others are still fetching instead of quitting.
  let idx = 0;
  let active = 0;
  async function worker() {
    while (idx < MAX_PAGES && Date.now() - started < BUDGET_MS) {
      if (idx >= queue.length) {
        if (active === 0) return;
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }
      const url = queue[idx++];
      active++;
      try { await visit(url); } finally { active--; }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // ---- issues ----
  const found = {};
  const add = (type, url, detail) => {
    (found[type] ||= []).push(detail ? { url, detail } : { url });
  };
  const list = [...pages.values()];
  const okPages = list.filter((p) => p.status >= 200 && p.status < 300 && p.title !== undefined);
  const statusByUrl = new Map(list.map((p) => [p.url, p.status]));

  for (const p of list) {
    if (p.status >= 400 && p.status < 500) add("broken-page", p.url, `HTTP ${p.status}`);
    else if (p.status >= 500) add("server-error", p.url, `HTTP ${p.status}`);
    if (p.redirects >= 2) add("redirect-chain", p.url, `${p.redirects} hops`);
    if (p.ms != null && p.ms > SLOW_MS) add("slow-response", p.url, `${(p.ms / 1000).toFixed(1)}s`);
  }
  for (const p of okPages) {
    if (p.noindex) add("noindex-page", p.url);
    if (!p.title) add("missing-title", p.url);
    else if (p.title.length > 60) add("title-too-long", p.url, `${p.title.length} characters`);
    else if (p.title.length < 30) add("title-too-short", p.url, `${p.title.length} characters`);
    if (!p.description) add("missing-meta-description", p.url);
    else if (p.description.length > 160) add("meta-description-too-long", p.url, `${p.description.length} characters`);
    else if (p.description.length < 70) add("meta-description-too-short", p.url, `${p.description.length} characters`);
    if (p.h1 === 0) add("missing-h1", p.url);
    else if (p.h1 > 1) add("multiple-h1", p.url, `${p.h1} H1s`);
    if (p.headingSkip) add("heading-order-skip", p.url);
    if (p.imagesNoAlt > 0) add("images-missing-alt", p.url, `${p.imagesNoAlt} of ${p.images}`);
    if (p.words < 200) add("thin-content", p.url, `${p.words} words`);
    if (p.internal.length === 0) add("no-outgoing-links", p.url);
    if (p.canonical && p.canonical !== normalizeUrl(p.finalUrl, p.finalUrl)) add("canonicalized-page", p.url, p.canonical);
    const broken = p.internal.filter((l) => (statusByUrl.get(l) || 0) >= 400);
    if (broken.length) add("broken-link", p.url, broken.slice(0, 3).join(", "));
  }

  // Duplicates only among indexable pages that canonicalize to themselves.
  const dupCandidates = okPages.filter((p) => !p.noindex && (!p.canonical || p.canonical === normalizeUrl(p.finalUrl, p.finalUrl)));
  const dup = (key, type) => {
    const groups = new Map();
    for (const p of dupCandidates) {
      const k = key(p);
      if (!k) continue;
      groups.set(k, [...(groups.get(k) || []), p]);
    }
    for (const g of groups.values()) if (g.length > 1) for (const p of g) add(type, p.url, `${g.length} pages share it`);
  };
  dup((p) => p.title, "duplicate-title");
  dup((p) => p.description, "duplicate-meta-description");
  dup((p) => p.contentHash, "duplicate-content");

  const issues = Object.entries(found)
    .map(([type, items]) => ({ type, ...ISSUES[type], count: items.length, pages: items.slice(0, 10) }))
    .sort((a, b) => WEIGHT[b.severity] - WEIGHT[a.severity] || b.count - a.count);

  // Score: share of the possible penalty avoided, per page crawled.
  const crawled = Math.max(1, list.length);
  const penalty = issues.reduce((s, i) => s + WEIGHT[i.severity] * Math.min(i.count, crawled), 0);
  const score = Math.max(0, Math.round(100 - (penalty / (crawled * 12)) * 100));

  return {
    checkedAt: new Date().toISOString(),
    site: { url: first.url, host, robotsTxt: sm.robotsTxt, sitemap: sm.sitemapFound, sitemapUrls: sm.urls.length },
    score,
    summary: {
      crawled: list.length,
      ok: okPages.length,
      errors: list.filter((p) => p.status >= 400 || p.status === 0).length,
      high: issues.filter((i) => i.severity === "high").reduce((s, i) => s + i.count, 0),
      limited: queue.length > list.length,
      ms: Date.now() - started,
    },
    issues,
    pages: list.map((p) => ({ url: p.url, status: p.status, title: p.title ?? null, words: p.words ?? null, ms: p.ms })),
  };
}
