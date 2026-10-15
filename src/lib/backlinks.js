// Local backlink & citation finder.
//
// What it measures (all from public, fetchable data):
//   - which business profiles and directories your homepage links to
//     (and the sameAs profiles in your schema),
//   - the same for up to one competitor, so the gap is concrete,
//   - basic link and crawl signals: HTTPS, robots.txt, sitemap size,
//     internal / external / nofollow links, domain age (RDAP).
// What it can't measure, and says so: who links TO you across the web.
// That needs a web-scale crawler index (what Ahrefs and Semrush sell).
// It never creates links anywhere — automated link building is a Google
// spam-policy violation and would hurt the businesses this is built for.

import { safeFetch, FetchBlockedError } from "./safe-fetch";

// Legitimate places a local business in India can be listed. Only real
// platforms, linked by their home domain. `cats` decides who sees what.
export const PLATFORMS = [
  { id: "gbp", name: "Google Business Profile", domains: ["google.com/maps", "maps.google.", "g.page", "maps.app.goo.gl", "goo.gl/maps", "business.google.com"], home: "https://business.google.com", cats: ["*"], why: "The listing Google Maps and AI assistants read first. Your site should link to it." },
  { id: "bing", name: "Bing Places", domains: ["bingplaces.com", "bing.com/maps"], home: "https://www.bingplaces.com", cats: ["*"], why: "Feeds Bing, Copilot and ChatGPT search results." },
  { id: "apple", name: "Apple Business Connect", domains: ["businessconnect.apple.com", "maps.apple.com"], home: "https://businessconnect.apple.com", cats: ["*"], why: "Puts you on Apple Maps and Siri." },
  { id: "facebook", name: "Facebook page", domains: ["facebook.com", "fb.com"], home: "https://www.facebook.com/pages/create", cats: ["*"], why: "A profile with your name, address and phone that search engines cross-check." },
  { id: "instagram", name: "Instagram", domains: ["instagram.com"], home: "https://www.instagram.com", cats: ["*"], why: "Shows the business is active; often listed in AI answers." },
  { id: "linkedin", name: "LinkedIn page", domains: ["linkedin.com"], home: "https://www.linkedin.com/company/setup/new/", cats: ["professional", "realestate", "clinic", "dental", "education", "other"], why: "An authoritative profile for professional and B2B businesses." },
  { id: "youtube", name: "YouTube channel", domains: ["youtube.com", "youtu.be"], home: "https://www.youtube.com", cats: ["*"], why: "Video answers rank in Google and get quoted by AI assistants." },
  { id: "justdial", name: "Justdial", domains: ["justdial.com"], home: "https://www.justdial.com", cats: ["*"], why: "India's largest local directory; a common citation source." },
  { id: "sulekha", name: "Sulekha", domains: ["sulekha.com"], home: "https://www.sulekha.com", cats: ["*"], why: "Local services directory with city pages." },
  { id: "indiamart", name: "IndiaMART", domains: ["indiamart.com"], home: "https://seller.indiamart.com", cats: ["shop", "interiors", "other"], why: "Product and supplier directory." },
  { id: "practo", name: "Practo", domains: ["practo.com"], home: "https://www.practo.com/providers", cats: ["clinic", "dental"], why: "The main doctor-discovery platform in India." },
  { id: "lybrate", name: "Lybrate", domains: ["lybrate.com"], home: "https://www.lybrate.com", cats: ["clinic", "dental"], why: "Doctor profiles and consultations." },
  { id: "zomato", name: "Zomato", domains: ["zomato.com"], home: "https://www.zomato.com/partner-with-us", cats: ["food"], why: "Where diners check menus, photos and reviews." },
  { id: "swiggy", name: "Swiggy", domains: ["swiggy.com"], home: "https://partner.swiggy.com", cats: ["food"], why: "Delivery listing with your address and hours." },
  { id: "magicpin", name: "magicpin", domains: ["magicpin.in"], home: "https://magicpin.in", cats: ["food", "salon", "shop"], why: "Local discovery for restaurants, salons and shops." },
  { id: "magicbricks", name: "MagicBricks", domains: ["magicbricks.com"], home: "https://www.magicbricks.com", cats: ["realestate"], why: "Property listings with agent and builder profiles." },
  { id: "99acres", name: "99acres", domains: ["99acres.com"], home: "https://www.99acres.com", cats: ["realestate"], why: "Property portal with builder and agent pages." },
  { id: "housing", name: "Housing.com", domains: ["housing.com"], home: "https://housing.com", cats: ["realestate"], why: "Property portal with project pages." },
  { id: "wedmegood", name: "WedMeGood", domains: ["wedmegood.com"], home: "https://www.wedmegood.com", cats: ["wedding"], why: "Wedding venue and vendor directory." },
  { id: "weddingwire", name: "WeddingWire India", domains: ["weddingwire.in"], home: "https://www.weddingwire.in", cats: ["wedding"], why: "Venue and vendor listings with reviews." },
  { id: "urbancompany", name: "Urban Company", domains: ["urbancompany.com"], home: "https://www.urbancompany.com", cats: ["salon", "interiors"], why: "Home and beauty services marketplace." },
  { id: "houzz", name: "Houzz", domains: ["houzz.in", "houzz.com"], home: "https://www.houzz.in", cats: ["interiors"], why: "Portfolio site for interior designers and architects." },
  { id: "tripadvisor", name: "Tripadvisor", domains: ["tripadvisor.in", "tripadvisor.com"], home: "https://www.tripadvisor.in", cats: ["hotel", "food"], why: "Reviews that travellers and AI assistants cite." },
  { id: "booking", name: "Booking.com", domains: ["booking.com"], home: "https://join.booking.com", cats: ["hotel"], why: "Hotel listing with your address and photos." },
  { id: "makemytrip", name: "MakeMyTrip", domains: ["makemytrip.com"], home: "https://www.makemytrip.com", cats: ["hotel"], why: "India's largest travel booking platform." },
  { id: "cardekho", name: "CarDekho", domains: ["cardekho.com"], home: "https://www.cardekho.com", cats: ["auto"], why: "Dealer listings for car buyers." },
  { id: "carwale", name: "CarWale", domains: ["carwale.com"], home: "https://www.carwale.com", cats: ["auto"], why: "Dealer locator and reviews." },
  { id: "lawrato", name: "LawRato", domains: ["lawrato.com"], home: "https://lawrato.com", cats: ["professional"], why: "Lawyer directory with profiles." },
  { id: "urbanpro", name: "UrbanPro", domains: ["urbanpro.com"], home: "https://www.urbanpro.com", cats: ["education"], why: "Tutor and coaching directory." },
  { id: "shiksha", name: "Shiksha", domains: ["shiksha.com"], home: "https://www.shiksha.com", cats: ["education"], why: "Institute listings students compare." },
];

export const CATEGORIES = [
  ["clinic", "Clinic or doctor"], ["dental", "Dental clinic"], ["food", "Restaurant or cafe"], ["realestate", "Real estate"],
  ["wedding", "Wedding venue or events"], ["interiors", "Interior design or home services"], ["salon", "Salon or spa"],
  ["hotel", "Hotel"], ["auto", "Car dealer or service"], ["professional", "Lawyer, CA or consultant"],
  ["education", "Coaching or education"], ["shop", "Shop or retail"], ["other", "Something else"],
];

const forCategory = (cat) => PLATFORMS.filter((p) => p.cats.includes("*") || p.cats.includes(cat));

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

function extractLinks(html, baseUrl) {
  const base = new URL(baseUrl);
  const links = [];
  for (const m of html.matchAll(/<a\b[^>]*?href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi)) {
    const href = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (!href || /^(#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let abs; try { abs = new URL(href, base); } catch { continue; }
    if (!/^https?:$/.test(abs.protocol)) continue;
    const rel = (m[0].match(/\brel\s*=\s*["']([^"']*)["']/i)?.[1] || "").toLowerCase();
    links.push({ url: abs.href, host: abs.hostname.replace(/^www\./, ""), internal: abs.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, ""), nofollow: /nofollow|ugc|sponsored/.test(rel) });
  }
  return links;
}

function extractSameAs(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (o) => {
        if (!o || typeof o !== "object") return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o.sameAs) [].concat(o.sameAs).forEach((u) => typeof u === "string" && out.push(u));
        Object.values(o).forEach(walk);
      };
      walk(JSON.parse(m[1].trim()));
    } catch { /* invalid JSON-LD is reported by the full audit, not here */ }
  }
  return [...new Set(out)];
}

const matchPlatform = (url, p) => p.domains.some((d) => url.toLowerCase().includes(d));

function guessName(html, host) {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{2,80})["']/i)?.[1];
  const title = html.match(/<title[^>]*>([^<]{2,120})<\/title>/i)?.[1];
  const raw = (og || title || host).replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").trim();
  return raw.split(/\s[|–—:-]\s|\|/)[0].trim().slice(0, 60) || host;
}

async function siteSignals(origin) {
  const [robots, sitemap] = await Promise.all([
    safeFetch(`${origin}/robots.txt`, { timeoutMs: 6000, maxBytes: 200_000, accept: "text/plain,*/*" }).catch(() => null),
    safeFetch(`${origin}/sitemap.xml`, { timeoutMs: 6000, maxBytes: 3_000_000, accept: "application/xml,text/xml,*/*" }).catch(() => null),
  ]);
  const smBody = sitemap?.ok ? sitemap.body : "";
  const isXml = /<(urlset|sitemapindex)\b/i.test(smBody);
  return {
    robotsTxt: Boolean(robots?.ok && !/<html/i.test(robots.body)),
    sitemap: isXml ? { urls: (smBody.match(/<loc>/gi) || []).length, index: /<sitemapindex\b/i.test(smBody) } : null,
  };
}

async function domainAge(host) {
  const apex = host.split(".").slice(-2).join(".");
  const domain = /\.(co|org|net|gov|ac|edu)\.in$/.test(host) ? host.split(".").slice(-3).join(".") : apex;
  try {
    const r = await safeFetch(`https://rdap.org/domain/${domain}`, { timeoutMs: 6000, maxBytes: 300_000, accept: "application/rdap+json,application/json" });
    if (!r.ok) return null;
    const j = JSON.parse(r.body);
    const ev = (j.events || []).find((e) => e.eventAction === "registration");
    return ev?.eventDate ? ev.eventDate.slice(0, 10) : null;
  } catch { return null; }
}

async function analyseSite(rawUrl) {
  const page = await safeFetch(rawUrl);
  if (!page.ok) {
    if (page.timedOut) throw new FetchBlockedError("That site took too long to respond.");
    throw new FetchBlockedError(page.status ? `That page returned HTTP ${page.status}.` : "We couldn't reach that website.");
  }
  const origin = new URL(page.url).origin;
  const host = hostOf(page.url);
  const links = extractLinks(page.body, page.url);
  const sameAs = extractSameAs(page.body);
  const external = links.filter((l) => !l.internal);
  const profileUrls = [...external.map((l) => l.url), ...sameAs];
  return {
    url: page.url, host, origin, https: page.url.startsWith("https://"), name: guessName(page.body, host),
    links: { internal: links.filter((l) => l.internal).length, external: external.length, nofollow: external.filter((l) => l.nofollow).length, externalHosts: [...new Set(external.map((l) => l.host))].length },
    sameAs, profileUrls,
  };
}

/**
 * @param {{url:string, name?:string, category?:string, competitor?:string}} input
 */
export async function findBacklinks({ url, name, category = "other", competitor }) {
  const cat = CATEGORIES.some(([k]) => k === category) ? category : "other";
  const [me, comp] = await Promise.all([
    analyseSite(url),
    competitor ? analyseSite(competitor).catch((e) => ({ error: e.message })) : Promise.resolve(null),
  ]);
  const [signals, registered] = await Promise.all([siteSignals(me.origin), domainAge(me.host)]);
  const bizName = (name || me.name).trim().slice(0, 80);
  const q = (s) => `https://www.google.com/search?q=${encodeURIComponent(s)}`;

  const platforms = forCategory(cat).map((p) => {
    const linked = me.profileUrls.find((u) => matchPlatform(u, p)) || null;
    const compLinked = comp && !comp.error ? Boolean(comp.profileUrls.find((u) => matchPlatform(u, p))) : null;
    const searchDomain = p.domains[0].split("/")[0];
    return {
      id: p.id, name: p.name, why: p.why, home: p.home,
      linkedFromSite: Boolean(linked), linkedUrl: linked,
      competitorLinks: compLinked,
      // We can't see inside every directory, so we hand over the exact search
      // that answers "am I listed?" instead of guessing.
      checkListing: p.id === "gbp" ? q(`${bizName} ${me.host}`) : q(`site:${searchDomain} "${bizName}"`),
    };
  });

  const linkedCount = platforms.filter((p) => p.linkedFromSite).length;
  const gaps = comp && !comp.error ? platforms.filter((p) => p.competitorLinks && !p.linkedFromSite).map((p) => p.name) : [];

  return {
    checkedAt: new Date().toISOString(),
    site: { url: me.url, host: me.host, name: bizName, https: me.https, registered, ...signals, links: me.links, sameAsCount: me.sameAs.length },
    category: cat,
    platforms,
    summary: { recommended: platforms.length, linked: linkedCount, missing: platforms.length - linkedCount },
    competitor: comp ? (comp.error ? { error: comp.error } : { host: comp.host, linked: platforms.filter((p) => p.competitorLinks).length, gaps }) : null,
    mentions: [
      { label: `Pages that mention "${bizName}" but aren't your site`, url: q(`"${bizName}" -site:${me.host}`), why: "Each one is a site that already knows you. Ask them to link your name to your website." },
      { label: `Pages that mention ${me.host} as plain text`, url: q(`"${me.host}" -site:${me.host}`), why: "Unlinked mentions of your domain are the easiest links to win." },
      { label: "Local news and blogs in your area", url: q(`"${bizName}" news OR blog -site:${me.host}`), why: "Local press links carry the most weight for local search." },
    ],
    cannotSee: "Which websites link to you across the whole web. That needs a crawler index of billions of pages, which is what paid tools like Ahrefs and Semrush sell. We don't estimate it.",
  };
}

export { FetchBlockedError };
