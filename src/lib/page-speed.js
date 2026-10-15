// Google PageSpeed Insights (Lighthouse run by Google, plus real-user Chrome
// data when the site has enough traffic). Google no longer serves keyless
// calls, so this needs PAGESPEED_API_KEY, or falls back to the Places key
// when the PageSpeed Insights API is enabled on that same Google project.

import { assertPublicHost, FetchBlockedError } from "./safe-fetch.js";

const PSI = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const FIELD = {
  LARGEST_CONTENTFUL_PAINT_MS: { label: "Largest Contentful Paint", unit: "ms" },
  INTERACTION_TO_NEXT_PAINT: { label: "Interaction to Next Paint", unit: "ms" },
  CUMULATIVE_LAYOUT_SHIFT_SCORE: { label: "Cumulative Layout Shift", unit: "cls" },
};

const LAB = ["largest-contentful-paint", "first-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"];

export async function pageSpeed(rawUrl, strategy = "mobile") {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new FetchBlockedError("That doesn't look like a valid URL.");
  }
  await assertPublicHost(url.hostname);

  const params = new URLSearchParams({ url: url.href, strategy: strategy === "desktop" ? "desktop" : "mobile" });
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) params.append("category", c);
  const key = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (key) params.set("key", key);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 55_000);
  let data;
  try {
    const res = await fetch(`${PSI}?${params}`, { signal: ctrl.signal });
    data = await res.json();
    if (!res.ok) {
      const e = new Error(
        res.status === 429
          ? "Google's PageSpeed quota is used up for now. Try again in a minute."
          : res.status === 403
            ? "The speed test isn't switched on yet. It will work once the PageSpeed Insights API is enabled."
            : data?.error?.message?.includes("FAILED_DOCUMENT_REQUEST") || data?.error?.message?.includes("ERRORED_DOCUMENT_REQUEST")
            ? "Google couldn't load that page. Check the address and that the site is up."
            : "PageSpeed Insights couldn't test that page right now."
      );
      e.userFacing = true;
      throw e;
    }
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error("Google took too long to test that page. Try again.");
      err.userFacing = true;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }

  const lh = data.lighthouseResult || {};
  const cats = lh.categories || {};
  const score = (k) => (cats[k]?.score != null ? Math.round(cats[k].score * 100) : null);
  const audits = lh.audits || {};

  const field = Object.entries(FIELD)
    .map(([k, meta]) => {
      const m = data.loadingExperience?.metrics?.[k];
      if (!m) return null;
      return { key: k, label: meta.label, value: meta.unit === "cls" ? m.percentile / 100 : m.percentile, unit: meta.unit, rating: m.category };
    })
    .filter(Boolean);

  const opportunities = Object.values(audits)
    .filter((a) => a.details?.type === "opportunity" && a.score !== null && a.score < 0.9 && (a.details.overallSavingsMs || 0) > 100)
    .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
    .slice(0, 6)
    .map((a) => ({ id: a.id, title: a.title, savingsMs: Math.round(a.details.overallSavingsMs) }));

  return {
    checkedAt: new Date().toISOString(),
    url: lh.finalDisplayedUrl || lh.finalUrl || url.href,
    strategy: params.get("strategy"),
    scores: { performance: score("performance"), accessibility: score("accessibility"), bestPractices: score("best-practices"), seo: score("seo") },
    lab: LAB.filter((k) => audits[k]).map((k) => ({ id: k, label: audits[k].title, display: audits[k].displayValue, score: audits[k].score })),
    field,
    fieldOverall: data.loadingExperience?.overall_category || null,
    opportunities,
  };
}
