// Growlocal visibility auditor.
// Fetches a URL server-side and scores it across three surfaces, 100 points each:
//   SEO — classic Google ranking signals
//   AEO — Answer Engine Optimization (ChatGPT / Perplexity / AI Overviews citation-readiness)
//   GEO — Generative + Geographic optimization (local intent, "near me")
//
// Every check returns a `fix` string with concrete, copy-pasteable instructions.

const MAX_BYTES = 3_000_000;
const TIMEOUT_MS = 10_000;

// ---------- parsing helpers ----------
const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const grab = (re, html) => { const m = html.match(re); return m ? m[1] : null; };
const grabAll = (re, html) => { const out = []; let m; while ((m = re.exec(html))) out.push(m[1]); return out; };

function parseJsonLd(html) {
  const blocks = grabAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, html);
  const out = [];
  for (const b of blocks) {
    try {
      const p = JSON.parse(b.trim().replace(/^﻿/, ""));
      if (Array.isArray(p)) out.push(...p);
      else if (p["@graph"] && Array.isArray(p["@graph"])) out.push(...p["@graph"]);
      else out.push(p);
    } catch { /* malformed JSON-LD — ignored, flagged separately */ }
  }
  return out;
}

function typesOf(node) {
  const t = node?.["@type"];
  if (!t) return [];
  return (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase());
}

function findType(schemas, ...wanted) {
  const set = new Set(wanted.map((w) => w.toLowerCase()));
  return schemas.find((s) => typesOf(s).some((t) => set.has(t)));
}

const hasType = (schemas, ...wanted) => Boolean(findType(schemas, ...wanted));

// ---------- fetch ----------
async function fetchPage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; GrowlocalBot/1.0; +https://growlocal.vercel.app/audit)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const ct = res.headers.get("content-type") || "";
    if (!/html|xml|text/i.test(ct)) throw new Error(`That URL returned ${ct || "a non-HTML response"} — point it at an HTML page.`);
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
    return {
      html: new TextDecoder("utf-8", { fatal: false }).decode(slice),
      finalUrl: res.url || url,
      status: res.status,
      truncated: buf.byteLength > MAX_BYTES,
    };
  } catch (e) {
    if (e.name === "AbortError") throw new Error("That site took longer than 10 seconds to respond.");
    throw e;
  } finally { clearTimeout(timer); }
}

// ---------- check builder ----------
const check = (id, label, earned, max, fix = null) => ({
  id, label, points: earned, max, pass: earned >= max, partial: earned > 0 && earned < max, fix,
});

// ============ SEO (100) ============
function auditSEO(html, url, schemas) {
  const c = [];

  // Title (12)
  const title = strip(grab(/<title[^>]*>([\s\S]*?)<\/title>/i, html) || "");
  if (!title) c.push(check("seo_title", "Page has no <title> tag", 0, 12, `Add a <title> in <head>. Aim for 30-60 characters, lead with the primary keyword, end with your brand. Example: <title>Dental Implants in Ballygunge | Your Clinic</title>`));
  else if (title.length >= 30 && title.length <= 60) c.push(check("seo_title", `Title is ${title.length} chars — ideal length`, 12, 12));
  else c.push(check("seo_title", `Title is ${title.length} chars (ideal is 30-60)`, 6, 12, `Rewrite to 30-60 characters so Google doesn't truncate it. Current title: "${title.slice(0, 90)}${title.length > 90 ? "…" : ""}"`));

  // Meta description (10)
  const desc = grab(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i, html)
    || grab(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i, html);
  if (!desc) c.push(check("seo_desc", "No meta description", 0, 10, `Add <meta name="description" content="..."> to <head>. 50-160 characters. Lead with the outcome the visitor gets, not a company boast.`));
  else if (desc.length >= 50 && desc.length <= 160) c.push(check("seo_desc", `Meta description is ${desc.length} chars — ideal length`, 10, 10));
  else c.push(check("seo_desc", `Meta description is ${desc.length} chars (ideal is 50-160)`, 5, 10, `Rewrite to 50-160 characters. Under 50 wastes the slot; over 160 gets cut off in results.`));

  // H1 (12)
  const h1s = grabAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, html).map(strip).filter(Boolean);
  if (h1s.length === 1) c.push(check("seo_h1", `Exactly one <h1>: "${h1s[0].slice(0, 70)}"`, 12, 12));
  else if (h1s.length === 0) c.push(check("seo_h1", "No <h1> heading found", 0, 12, `Add exactly one <h1> describing what this page is about. It's the strongest on-page relevance signal you control.`));
  else c.push(check("seo_h1", `${h1s.length} <h1> tags found — should be exactly one`, 4, 12, `Keep the single most important heading as <h1> and demote the rest to <h2>. Multiple H1s dilute the topical signal.`));

  // Heading hierarchy (6)
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  if (h2Count >= 2) c.push(check("seo_headings", `${h2Count} <h2> subheadings structure the page`, 6, 6));
  else c.push(check("seo_headings", `Only ${h2Count} <h2> subheading${h2Count === 1 ? "" : "s"}`, h2Count ? 3 : 0, 6, `Break the page into sections with <h2> headings. Both Google and AI extractors use heading structure to understand what a page covers.`));

  // Canonical (8)
  if (/<link[^>]+rel=["']canonical["']/i.test(html)) c.push(check("seo_canonical", "Canonical URL declared", 8, 8));
  else c.push(check("seo_canonical", "No canonical URL", 0, 8, `Add <link rel="canonical" href="${url}"> to <head>. Prevents duplicate-content splits when the page is reachable at multiple URLs (trailing slash, query params, http vs https).`));

  // Viewport (8)
  if (/<meta[^>]+name=["']viewport["']/i.test(html)) c.push(check("seo_viewport", "Mobile viewport configured", 8, 8));
  else c.push(check("seo_viewport", "No viewport meta tag", 0, 8, `Add <meta name="viewport" content="width=device-width, initial-scale=1">. Without it, mobile Google treats the page as non-responsive — and most local searches are mobile.`));

  // HTTPS (8)
  if (url.startsWith("https://")) c.push(check("seo_https", "Served over HTTPS", 8, 8));
  else c.push(check("seo_https", "Not served over HTTPS", 0, 8, `Move to HTTPS. Get a free certificate via Let's Encrypt or enable it in your host's dashboard. Browsers label HTTP pages "Not secure" and Google demotes them.`));

  // lang attribute (5)
  const lang = grab(/<html[^>]+lang=["']([^"']+)["']/i, html);
  if (lang) c.push(check("seo_lang", `Language declared: lang="${lang}"`, 5, 5));
  else c.push(check("seo_lang", "No lang attribute on <html>", 0, 5, `Set <html lang="en-IN"> (or your locale). Helps search engines and AI systems serve your page to the right audience.`));

  // Open Graph (10)
  const og = ["og:title", "og:description", "og:image"].filter((p) => new RegExp(`property=["']${p}["']`, "i").test(html));
  if (og.length === 3) c.push(check("seo_og", "Open Graph tags complete", 10, 10));
  else {
    const missing = ["og:title", "og:description", "og:image"].filter((p) => !og.includes(p));
    c.push(check("seo_og", `Open Graph incomplete — ${og.length}/3 present`, og.length * 3, 10, `Add the missing tags: ${missing.join(", ")}. These control how your link looks when shared on WhatsApp, LinkedIn and Slack — a blank preview kills click-through.`));
  }

  // Image alt text (10)
  const imgs = html.match(/<img[^>]*>/gi) || [];
  const withAlt = imgs.filter((i) => /\salt=["'][^"']*["']/i.test(i)).length;
  if (imgs.length === 0) c.push(check("seo_alt", "No images on this page", 5, 10, `No images found. Visual content increases dwell time and gives you image-search surface area. Add photos of your work, team, or premises — with alt text.`));
  else if (withAlt / imgs.length >= 0.9) c.push(check("seo_alt", `${withAlt}/${imgs.length} images have alt text`, 10, 10));
  else c.push(check("seo_alt", `Only ${withAlt}/${imgs.length} images have alt text`, Math.round((withAlt / imgs.length) * 10), 10, `Add descriptive alt text to the remaining ${imgs.length - withAlt} image${imgs.length - withAlt === 1 ? "" : "s"}. Describe what's in the image, not "image1.jpg". Use alt="" only for purely decorative graphics.`));

  // Structured data present (11)
  if (schemas.length > 0) c.push(check("seo_schema", `${schemas.length} structured-data block${schemas.length === 1 ? "" : "s"} found`, 11, 11));
  else c.push(check("seo_schema", "No structured data (JSON-LD)", 0, 11, `Add JSON-LD to <head>. Start with Organization and LocalBusiness. Validate at search.google.com/test/rich-results. This is the single highest-leverage technical fix on most sites.`));

  return c;
}

// ============ AEO (100) ============
function auditAEO(html, schemas) {
  const c = [];

  // FAQPage schema (22)
  const faq = findType(schemas, "FAQPage");
  if (faq) {
    const n = Array.isArray(faq.mainEntity) ? faq.mainEntity.length : 0;
    c.push(check("aeo_faq_schema", `FAQPage schema with ${n} question${n === 1 ? "" : "s"}`, 22, 22));
  } else {
    c.push(check("aeo_faq_schema", "No FAQPage schema", 0, 22, `This is the #1 AEO fix. Add a FAQ section with FAQPage JSON-LD covering 15-25 real customer questions (pricing, timings, process, location, what to expect). AI answer engines lift these answers almost verbatim when citing sources.`));
  }

  // Question-format headings (18)
  const headings = grabAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi, html).map(strip).filter(Boolean);
  const questions = headings.filter((h) => /^(how|what|why|when|where|who|which|do|does|is|are|can|should|will)\b/i.test(h) || h.endsWith("?"));
  if (questions.length >= 5) c.push(check("aeo_questions", `${questions.length} headings written as questions`, 18, 18));
  else if (questions.length >= 2) c.push(check("aeo_questions", `Only ${questions.length} question-format headings`, 9, 18, `Rewrite more <h2>/<h3> headings as the questions customers actually type: "How much does X cost?", "How long does Y take?". AI extractors match user queries against headings — statement headings score far lower.`));
  else c.push(check("aeo_questions", "No question-format headings", 0, 18, `Convert your section headings into questions. Instead of "Our Services" use "What services do you offer?". Instead of "Pricing" use "How much does it cost?". This alone materially changes AI citation rates.`));

  // Direct answer pattern (14)
  const paras = grabAll(/<p[^>]*>([\s\S]*?)<\/p>/gi, html).map(strip).filter((p) => p.length > 20);
  const definitional = paras.slice(0, 5).some((p) => /^[^.!?]{15,180}\b(is|are|means|refers to|involves|includes)\b/i.test(p));
  if (definitional) c.push(check("aeo_direct_answer", "Opens with a direct, definitional statement", 14, 14));
  else c.push(check("aeo_direct_answer", "No direct answer in the opening", 0, 14, `Start the page with a one-sentence definition in the pattern "<Thing> is <what it is>." AI systems preferentially quote this construction. Bury the marketing language below it.`));

  // Concise extractable paragraphs (12)
  const concise = paras.filter((p) => p.length >= 40 && p.length <= 320).length;
  if (paras.length === 0) c.push(check("aeo_concise", "No paragraph content found", 0, 12, `The page has no substantive prose. AI engines can't cite what isn't there — add real written content answering customer questions.`));
  else if (concise / paras.length >= 0.4) c.push(check("aeo_concise", `${concise}/${paras.length} paragraphs are cleanly extractable`, 12, 12));
  else c.push(check("aeo_concise", `Only ${concise}/${paras.length} paragraphs are concise enough to extract`, 6, 12, `Break long paragraphs into 40-320 character chunks. AI answer engines lift self-contained sentences — a 600-word wall of text gets skipped in favour of a competitor's tight paragraph.`));

  // Author / E-E-A-T (12)
  const authored = schemas.some((s) => s?.author || s?.creator) || /<meta[^>]+name=["']author["']/i.test(html) || /\brel=["']author["']/i.test(html);
  if (authored) c.push(check("aeo_author", "Author / creator attribution present", 12, 12));
  else c.push(check("aeo_author", "No author attribution", 0, 12, `Add author metadata — either an Article schema with an "author" object, or <meta name="author" content="Name">. Google and AI systems weight E-E-A-T (Experience, Expertise, Authority, Trust) heavily; anonymous content ranks lower.`));

  // Article / content schema (10)
  if (hasType(schemas, "Article", "BlogPosting", "NewsArticle", "WebPage")) c.push(check("aeo_article", "Content-type schema present", 10, 10));
  else c.push(check("aeo_article", "No Article or WebPage schema", 0, 10, `Add Article (for posts) or WebPage (for standard pages) JSON-LD with headline, description, datePublished and author. Gives AI systems the metadata to judge freshness and authority.`));

  // HowTo (6)
  if (hasType(schemas, "HowTo")) c.push(check("aeo_howto", "HowTo schema present", 6, 6));
  else c.push(check("aeo_howto", "No HowTo schema", 0, 6, `If any page explains a process, wrap it in HowTo JSON-LD with numbered steps. Captures the enormous "how do I…" query volume that AI assistants field.`));

  // Breadcrumbs (6)
  if (hasType(schemas, "BreadcrumbList")) c.push(check("aeo_breadcrumb", "BreadcrumbList schema present", 6, 6));
  else c.push(check("aeo_breadcrumb", "No breadcrumb schema", 0, 6, `Add BreadcrumbList JSON-LD showing the page's place in your site hierarchy. Helps AI understand context and earns breadcrumb display in results.`));

  return c;
}

// ============ GEO (100) ============
const LOCAL_TYPES = [
  "LocalBusiness", "Restaurant", "Hotel", "Store", "MedicalClinic", "Dentist", "Physician",
  "MedicalOrganization", "ProfessionalService", "EducationalOrganization", "RealEstateAgent",
  "AccountingService", "LegalService", "AutomotiveBusiness", "BeautySalon", "HealthAndBeautyBusiness",
  "DaySpa", "ExerciseGym", "Bakery", "CafeOrCoffeeShop", "Pharmacy", "VeterinaryCare",
];

function auditGEO(html, schemas) {
  const c = [];
  const biz = findType(schemas, ...LOCAL_TYPES);

  // LocalBusiness schema (24)
  if (biz) {
    const t = Array.isArray(biz["@type"]) ? biz["@type"].join(", ") : biz["@type"];
    c.push(check("geo_localbusiness", `LocalBusiness schema present (@type: ${t})`, 24, 24));
  } else {
    c.push(check("geo_localbusiness", "No LocalBusiness schema", 0, 24, `Highest-impact local fix. Add JSON-LD with the @type matching your vertical — Restaurant, Dentist, Hotel, MedicalClinic, RealEstateAgent, BeautySalon, etc. Include name, address, geo, telephone, openingHoursSpecification, areaServed and url.`));
  }

  // Address (14)
  if (biz?.address) c.push(check("geo_address", "Structured postal address in schema", 14, 14));
  else c.push(check("geo_address", "No structured address", 0, 14, `Add an "address" object with @type PostalAddress and fields streetAddress, addressLocality, addressRegion, postalCode, addressCountry. Must match your Google Business Profile exactly — mismatches (NAP inconsistency) suppress local rankings.`));

  // Geo coordinates (12)
  if (biz?.geo) c.push(check("geo_coords", "Latitude / longitude in schema", 12, 12));
  else c.push(check("geo_coords", "No geo coordinates", 0, 12, `Add "geo": { "@type": "GeoCoordinates", "latitude": 22.5405, "longitude": 88.3648 } using your actual location. Right-click your spot in Google Maps to copy exact coordinates.`));

  // areaServed (10)
  if (biz?.areaServed) c.push(check("geo_area", "areaServed declared", 10, 10));
  else c.push(check("geo_area", "No areaServed field", 0, 10, `Add "areaServed" listing every locality you serve as an array of City objects. This is what matches you to "near me" and "in <neighbourhood>" queries beyond your exact pin.`));

  // Opening hours (10)
  if (biz?.openingHoursSpecification || biz?.openingHours) c.push(check("geo_hours", "Opening hours in schema", 10, 10));
  else c.push(check("geo_hours", "No opening hours in schema", 0, 10, `Add openingHoursSpecification with dayOfWeek, opens and closes for each day. Powers the "Open now" filter — one of the most-used local search refinements.`));

  // tel: link (12)
  if (/<a[^>]+href=["']tel:/i.test(html)) c.push(check("geo_tel_link", "Tap-to-call link present", 12, 12));
  else c.push(check("geo_tel_link", "No tap-to-call link", 0, 12, `Add <a href="tel:+919876543210">Call us</a> in your header and footer. Most local searches happen on mobile, and a tap-to-call button is the shortest path from search to enquiry.`));

  // Telephone in schema (6)
  if (biz?.telephone) c.push(check("geo_tel_schema", "Telephone in structured data", 6, 6));
  else c.push(check("geo_tel_schema", "No telephone in schema", 0, 6, `Add "telephone": "+91-98765-43210" to your LocalBusiness schema in full international format.`));

  // Map presence (6)
  if (/(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.googleapis\.com|openstreetmap)/i.test(html)) {
    c.push(check("geo_map", "Map embed or Maps link found", 6, 6));
  } else {
    c.push(check("geo_map", "No map embed or Maps link", 0, 6, `Embed a Google Maps iframe on your contact page, or link to your Google Business Profile. Doubles as a trust signal and a geographic relevance signal.`));
  }

  // Location signals in copy (6)
  const text = strip(html);
  const locale = /\b(near me|near you|in\s+[A-Z][a-z]{3,}|serving\s+[A-Z][a-z]{3,}|located in|based in)\b/.test(text);
  if (locale) c.push(check("geo_copy", "Location language present in page copy", 6, 6));
  else c.push(check("geo_copy", "No location signals in the copy", 0, 6, `Name your city and neighbourhood in the <h1>, the first paragraph, and the footer. Schema tells machines where you are; body copy tells them you're relevant to searchers there.`));

  return c;
}

// ---------- main ----------
export async function runAudit(rawUrl) {
  let url;
  try {
    const candidate = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    url = new URL(candidate).toString();
  } catch {
    throw new Error("That doesn't look like a valid URL. Try something like example.com");
  }

  const { html, finalUrl, status, truncated } = await fetchPage(url);
  if (status >= 400) throw new Error(`That site returned HTTP ${status}.`);

  const schemas = parseJsonLd(html);
  const groups = {
    SEO: auditSEO(html, finalUrl, schemas),
    AEO: auditAEO(html, schemas),
    GEO: auditGEO(html, schemas),
  };

  const scores = {};
  for (const [k, checks] of Object.entries(groups)) {
    const earned = checks.reduce((s, x) => s + x.points, 0);
    const max = checks.reduce((s, x) => s + x.max, 0);
    scores[k] = {
      score: Math.round((earned / max) * 100),
      earned,
      max,
      checks,
      passing: checks.filter((x) => x.pass).length,
      failing: checks.filter((x) => !x.pass).length,
    };
  }

  const overall = Math.round((scores.SEO.score + scores.AEO.score + scores.GEO.score) / 3);

  // Top 5 fixes across all categories, ranked by points recoverable
  const priorities = Object.entries(groups)
    .flatMap(([cat, checks]) => checks.filter((x) => !x.pass && x.fix).map((x) => ({ ...x, category: cat, recoverable: x.max - x.points })))
    .sort((a, b) => b.recoverable - a.recoverable)
    .slice(0, 5);

  return {
    url: finalUrl,
    truncated,
    overall,
    grade: overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F",
    scores,
    priorities,
    schemaTypes: [...new Set(schemas.flatMap(typesOf))].filter(Boolean),
    auditedAt: new Date().toISOString(),
  };
}
