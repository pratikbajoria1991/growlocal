// Batch prospecting.
//
// The competitive scan showed the pattern worth selling against: businesses
// that paid for a decent website (high SEO) but are invisible to answer
// engines and local search (low AEO/GEO). Those are the easiest sales —
// the gap is large, provable in one screenshot, and they've already
// demonstrated they'll spend money on their web presence.

import { get, set } from "./store";

const KEY = "concierge:prospects";

/**
 * Opportunity = how big the winnable gap is, weighted by evidence the business
 * actually invests in its web presence.
 *
 * A site scoring 5/100 everywhere is a bigger "gap" arithmetically, but it's a
 * worse prospect — nobody's minding the shop, and they likely won't pay. A site
 * with SEO 90 / GEO 10 has an owner who cares, spent money, and is still
 * invisible for "near me". That's the pitch that closes.
 */
export function opportunityScore({ seo, aeo, geo }) {
  const gap = (100 - aeo) * 0.5 + (100 - geo) * 0.5; // 0-100, how much is missing
  const investment = Math.min(seo, 100) / 100;        // 0-1, do they maintain the site
  return Math.round(gap * investment);
}

export function temperature(score) {
  if (score >= 55) return { label: "Hot", tone: "hot" };
  if (score >= 35) return { label: "Warm", tone: "warm" };
  return { label: "Cold", tone: "cold" };
}

// A plain-language brief, built from the audit findings — no model needed, so
// this works today without an API key and never invents a claim.
export function buildBrief(p) {
  const t = temperature(p.opportunity);
  const gaps = (p.topGaps || []).slice(0, 3);

  return `# ${p.name || p.url}

**Visibility score: ${p.overall}/100 (grade ${p.grade})** — ${t.label} prospect
SEO ${p.seo}/100 · Answer engines ${p.aeo}/100 · Local & AI ${p.geo}/100
${p.url}

## The one-line pitch

${p.seo >= 70 && (p.aeo < 50 || p.geo < 50)
    ? `Their website is well built (SEO ${p.seo}/100) — someone was paid to do that properly. But it scores ${p.aeo}/100 for answer engines and ${p.geo}/100 for local search, which means when a customer asks ChatGPT or Google Maps for a business like theirs, they don't come up. They've already bought the car; nobody connected the wheels.`
    : `This site needs foundational work across the board (${p.overall}/100 overall). Lead with the quickest visible win rather than the full list — a full rebuild pitch will lose them.`}

## Three things to show them

${gaps.length ? gaps.map((g, i) => `${i + 1}. **${g.label}** — worth ${g.recoverable} points\n   ${g.fix}`).join("\n\n") : "_No failing checks — this is not a prospect._"}

## Talk track

Open with the score, not the features. "I ran your site through our visibility
checker — you're at ${p.overall}/100. Your SEO is ${p.seo >= 70 ? "actually strong" : "the weak point"}, but ${p.geo < 50 ? "you're nearly invisible for 'near me' searches" : "answer engines can't quote you"}. Want me to walk you through the three fixes?"

Do not send a proposal. Send the score.

---
_Scanned ${new Date(p.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · Growlocal_
`;
}

export async function listProspects() {
  return (await get(KEY)) || [];
}

export async function saveProspect(p) {
  const all = await listProspects();
  const without = all.filter((x) => x.url !== p.url);
  const next = [p, ...without].sort((a, b) => b.opportunity - a.opportunity).slice(0, 200);
  await set(KEY, next);
  return p;
}

export async function removeProspect(url) {
  const all = await listProspects();
  await set(KEY, all.filter((p) => p.url !== url));
  return true;
}

export async function clearProspects() {
  await set(KEY, []);
  return true;
}
