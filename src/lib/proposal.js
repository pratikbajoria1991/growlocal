// Machine-generated growth proposal — Discover → Diagnose → Decide.
//
// Takes a business (Maps link or "name, area"), pulls its live profile, its
// nearest competitors and its website audit, and produces:
//   - issues, grouped so one real problem counts once (no inflated totals),
//     each labelled with its evidence and who has to act;
//   - a priority order with the reason for it (Growth Brain v0: explicit
//     rules, not a trained model — there's no outcome data to learn from yet);
//   - the plan tier that fits, a four-week plan, and an outbound message.
//
// Every sentence a prospect reads is built from a measured value. Anything
// we can't measure is listed under "limits" instead of being estimated.

import crypto from "crypto";
import { get, set } from "./store";
import { BRAND, PROPOSAL_TIERS } from "./brand";
import { resolvePlace, scoreGbpProfile, GbpAuditError, GBP_NOT_ASSESSED } from "./gbp-audit";
import { runAudit } from "./audit";
import { discoverCompetitors } from "./competitors";
import { ACTION_TYPES } from "./ledger-types";
import { rankIssueImpact } from "./typesafe";

export const HANDLED_BY = {
  we_do: { label: "We just do it", short: "We do it" },
  you_approve: { label: "We do it after your OK", short: "Needs your OK" },
  you_help: { label: "We need something from you", short: "Needs your help" },
};

// "Website" links that aren't a website the business controls. From the
// Kolkata scan: a quarter of listed sites were Instagram, Practo or a chain page.
const RENTED = /(^|\.)(instagram\.com|facebook\.com|linktr\.ee|practo\.com|justdial\.com|sulekha\.com|zomato\.com|swiggy\.com|wa\.me|business\.site|sites\.google\.com)$/i;

// ---------- GBP profile issues ----------
const GBP_ISSUES = {
  gbp_status: { handledBy: "you_approve", actionType: "gbp_identity", weight: 100, title: "Google shows your business as not open" },
  gbp_category: { handledBy: "you_approve", actionType: "gbp_identity", weight: 70, title: "Your Google listing has no specific category" },
  gbp_phone: { handledBy: "you_approve", actionType: "gbp_links", weight: 60, title: "No phone number on your Google listing" },
  gbp_hours: { handledBy: "you_approve", actionType: "gbp_hours", weight: 55, title: "No opening hours on your Google listing" },
  gbp_website: { handledBy: "you_approve", actionType: "gbp_links", weight: 55, title: "Your Google listing doesn't link a website" },
  gbp_address: { handledBy: "you_approve", actionType: "gbp_identity", weight: 45, title: "Your address on Google is incomplete" },
  gbp_photos: { handledBy: "you_help", actionType: "gbp_photos", weight: 45, title: "Too few photos on your Google listing" },
};
// Review recency is deliberately absent: Google's API returns the 5 most
// *relevant* reviews, not the newest, so "no recent reviews" can't be read
// from them. A business with 4,000 reviews got told its latest was months old.
const REPUTATION_CHECKS = new Set(["gbp_rating", "gbp_review_volume"]);

// Categories we'll suggest adding only when they're genuine equivalents of one
// the business already has. Competitors carrying "indian restaurant" says
// nothing about whether a Chinese restaurant should — suggesting it would be
// advice to misrepresent the business.
const CATEGORY_FAMILIES = [
  ["dentist", "dental_clinic"],
  ["gym", "fitness_center"],
  ["hair_salon", "hair_care", "beauty_salon"],
  ["doctor", "medical_clinic"],
  ["physiotherapist", "physical_therapist"],
];

function equivalentMissingTypes(place, commonTypes) {
  const mine = new Set(place.types || []);
  return commonTypes.filter((t) =>
    CATEGORY_FAMILIES.some((family) => family.includes(t.type) && family.some((f) => f !== t.type && mine.has(f)))
  );
}

// ---------- website issues, grouped ----------
const WEB_GROUPS = [
  {
    id: "web_schema", handledBy: "we_do", actionType: "site_schema",
    title: "Google and AI assistants can't read your business details from your website",
    detail: "We add structured data — LocalBusiness, FAQ, opening hours, address and phone — so search engines and AI assistants read your details instead of guessing.",
    ids: ["seo_schema", "aeo_faq_schema", "aeo_article", "aeo_breadcrumb", "geo_localbusiness", "geo_address", "geo_coords", "geo_area", "geo_hours", "geo_tel_schema"],
  },
  // Scored by the general audit, but not a real gap for a local business —
  // nobody needs HowTo markup on a clinic's homepage. Never cited as evidence.
  { id: "ignore", ids: ["aeo_howto"] },
  {
    id: "web_answers", handledBy: "you_approve", actionType: "site_page",
    title: "Your website doesn't answer the questions customers ask AI assistants",
    detail: "We rewrite your key pages around the questions people actually ask, with direct answers an assistant can quote. You approve every page before it goes live.",
    ids: ["aeo_questions", "aeo_direct_answer", "aeo_author"], prefix: "aeo_",
  },
  {
    id: "web_local", handledBy: "we_do", actionType: "site_technical",
    title: "Your website doesn't make your location and phone easy to act on",
    detail: "We add tap-to-call, a map link and clear location wording, so mobile visitors can call or get directions in one tap.",
    ids: ["geo_tel_link", "geo_map", "geo_copy"], prefix: "geo_",
  },
  {
    id: "web_https", handledBy: "you_approve", actionType: "site_technical",
    title: "Your website isn't secure (no HTTPS)",
    detail: "We switch your site to HTTPS with your hosting provider. Browsers warn visitors away from insecure sites.",
    ids: ["seo_https"],
  },
  {
    id: "web_basics", handledBy: "we_do", actionType: "site_technical",
    title: "Search basics need fixing on your website",
    detail: "We fix page titles, descriptions, mobile settings and link previews — the basics Google uses to understand and display your pages.",
    ids: [], prefix: "seo_",
  },
];

function groupFor(check) {
  return WEB_GROUPS.find((g) => g.ids.includes(check.id))
    || WEB_GROUPS.find((g) => g.prefix && check.id.startsWith(g.prefix))
    || WEB_GROUPS.at(-1);
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

function buildIssues({ place, gbp, comp, site, webAudit, webError }) {
  const issues = [];
  const stats = comp.stats;
  const self = comp.self;
  const failing = gbp.checks.filter((c) => !c.pass);

  // Profile gaps
  for (const check of failing) {
    const spec = GBP_ISSUES[check.id];
    if (!spec) continue;
    // No website at all is one problem, not two: the "no_website" issue below
    // covers building the site and linking it from the listing.
    if (check.id === "gbp_website" && !site) continue;
    const evidence = [check.label];
    let competitorGap = false;
    if (check.id === "gbp_photos" && stats && stats.withTenPhotos != null && stats.withTenPhotos >= Math.ceil(stats.count / 2)) {
      evidence.push(`${stats.withTenPhotos} of the ${stats.count} nearest competitors show 10 or more`);
      competitorGap = true;
    }
    if (check.id === "gbp_website" && stats && stats.withWebsite >= Math.ceil(stats.count / 2)) {
      evidence.push(`${stats.withWebsite} of the ${stats.count} nearest competitors link one`);
      competitorGap = true;
    }
    issues.push({
      id: check.id, source: "gbp", evidence: "measured", ...spec,
      why: evidence.join(" — "), detail: check.fix, competitorGap,
    });
  }

  // Reputation: one issue, however many review signals are weak
  // A rating under 4.5★ isn't "holding you back" if nearby competitors rate
  // the same or lower — only cite it without competitor data, or when behind.
  const atOrAboveCompetitors = stats?.medianRating != null && self?.rating != null && self.rating >= stats.medianRating;
  const repFailing = failing.filter((c) => REPUTATION_CHECKS.has(c.id) && !(c.id === "gbp_rating" && atOrAboveCompetitors));
  const repEvidence = repFailing.map((c) => c.label);
  let repGap = null;
  let ratingGap = false;
  if (stats && stats.count >= 3 && self) {
    if (self.reviews < stats.medianReviews * 0.5) {
      repGap = Math.round((stats.medianReviews / Math.max(self.reviews, 1)) * 10) / 10;
      repEvidence.unshift(`${self.reviews} Google reviews vs a median of ${stats.medianReviews} across the ${stats.count} nearest competitors`);
    }
    if (self.rating != null && stats.medianRating != null && self.rating <= stats.medianRating - 0.2) {
      repEvidence.push(`${self.rating.toFixed(1)}★ vs the competitors' median of ${stats.medianRating.toFixed(1)}★`);
      ratingGap = true;
    }
    const myPace = self.pace?.reviewsPer30Days;
    if (myPace != null && stats.medianPace != null && myPace < stats.medianPace * 0.5) {
      repEvidence.push(`${myPace} new reviews a month vs a competitor median of ${stats.medianPace} (measured since ${self.pace.measuredSince.slice(0, 10)})`);
    }
  }
  if (repEvidence.length) {
    issues.push({
      id: "reputation", source: repGap ? "competitors" : "gbp", evidence: "measured",
      handledBy: "you_help", actionType: "review_requests",
      // Title says what the evidence actually shows — nothing broader.
      title: repGap && repGap >= 1.5
        ? `Nearby competitors have ${repGap}× your reviews`
        : ratingGap
          ? "Your rating is below nearby competitors'"
          : repFailing.length === 1 && repFailing[0].id === "gbp_rating"
            ? "Your average rating is below 4.5★"
            : "Your reviews are holding you back",
      why: repEvidence.join(" — "),
      detail: "We set up a review-request link and WhatsApp message for your front desk, reply to every review, and track your review pace week by week. You or your staff send the request after each visit.",
      weight: 60, competitorGap: Boolean(repGap),
    });
  }

  // Equivalent categories competitors carry and this listing doesn't
  const missingTypes = stats?.commonTypes?.length ? equivalentMissingTypes(place, stats.commonTypes) : [];
  if (missingTypes.length) {
    const labels = missingTypes.map((t) => `“${t.label}”`).join(", ");
    issues.push({
      id: "categories", source: "competitors", evidence: "measured",
      handledBy: "you_approve", actionType: "gbp_identity", weight: 50, competitorGap: true,
      title: `Nearby competitors are also listed under ${labels} — you aren't`,
      why: missingTypes.map((t) => `${t.count} of ${stats.count} nearest competitors carry Google's ${t.label} type`).join("; "),
      detail: "Adding matching secondary categories in Google Business Profile lets Google show you for those searches. We only add categories that truthfully describe your business.",
    });
  }

  // Website
  if (!site) {
    issues.push({
      id: "no_website", source: "website", evidence: "measured",
      handledBy: "you_approve", actionType: "site_page", weight: 65,
      competitorGap: Boolean(stats && stats.withWebsite >= Math.ceil(stats.count / 2)),
      title: "No website for Google and AI assistants to read",
      why: stats ? `No website on your Google listing — ${stats.withWebsite} of the ${stats.count} nearest competitors have one` : "No website on your Google listing",
      detail: "We build a fast, simple page with your services, hours, FAQ and structured data, so Google and assistants like ChatGPT can describe you accurately. You approve it before it goes live.",
    });
  } else if (webAudit === "rented") {
    const host = hostOf(site);
    issues.push({
      id: "rented_site", source: "website", evidence: "measured",
      handledBy: "you_approve", actionType: "site_page", weight: 60, competitorGap: false,
      title: `Your Google listing links to ${host}, not a website you own`,
      why: `The website field on your listing points to ${host}`,
      detail: "You can't add structured data or answer pages to a platform you don't control, so assistants and Google have little to read. We build a simple site you own and keep your platform profiles linked from it.",
    });
  } else if (webAudit?.scores) {
    const groups = new Map();
    for (const cat of ["SEO", "AEO", "GEO"]) {
      for (const check of webAudit.scores[cat].checks) {
        if (check.pass) continue;
        const g = groupFor(check);
        if (g.id === "ignore") continue;
        if (!groups.has(g.id)) groups.set(g.id, { group: g, checks: [] });
        groups.get(g.id).checks.push(check);
      }
    }
    for (const { group, checks } of groups.values()) {
      const recoverable = checks.reduce((s, c) => s + (c.max - c.points), 0);
      const labels = checks.map((c) => c.label);
      issues.push({
        id: group.id, source: "website", evidence: "measured",
        handledBy: group.handledBy, actionType: group.actionType,
        title: group.title, detail: group.detail, competitorGap: false,
        why: `${labels.slice(0, 4).join("; ")}${labels.length > 4 ? ` and ${labels.length - 4} more` : ""}`,
        weight: Math.min(80, 25 + recoverable * 2),
      });
    }
  }

  return issues;
}

function hostOf(url) {
  try { return new URL(/^https?:/i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

// Growth Brain v0 — explicit, explainable ordering. The explicit weight always
// decides the order; Jev only nudges within that when it's confident, and its
// opinion is named in the reason so nothing pretends to be a fixed rule.
const JEV_IMPACT_CAP = 12; // one issue per business type would be overfit; more than this just adds latency to a rate-limited public endpoint.
const JEV_MIN_CONFIDENCE = 0.6;

async function prioritize(issues, business) {
  let jev = null;
  if (issues.length && business) {
    jev = await rankIssueImpact(business, issues.slice(0, JEV_IMPACT_CAP).map((i) => ({ id: i.id, title: i.title, why: i.why })));
  }

  return issues
    .map((iss) => {
      let score = iss.weight;
      const reasons = [];
      if (iss.id === "gbp_status") reasons.push("nothing else matters while Google shows you as closed");
      if (iss.competitorGap) { score += 20; reasons.push("nearby competitors are clearly ahead here"); }
      if (iss.handledBy === "we_do") { score += 5; reasons.push("we can ship it this week without waiting on you"); }
      if (iss.handledBy === "you_help") score -= 5;

      const read = jev?.[iss.id];
      if (read && read.confidence >= JEV_MIN_CONFIDENCE) {
        // Impact is a 0-15 point nudge, not a re-weighting — it can't flip a
        // "closed on Google" issue below a cosmetic one.
        score += (read.impact - 0.5) * 30;
        if (read.impact >= 0.7) reasons.push("likely to move the needle for this specific business");
        else if (read.impact <= 0.3) reasons.push("lower expected payoff for this specific business");
      }

      if (!reasons.length) reasons.push(iss.source === "website" ? "it limits what Google and AI assistants can read about you" : "it affects how your listing shows up");
      return { ...iss, score, reason: reasons.join("; ") };
    })
    .sort((a, b) => b.score - a.score);
}

function tierFor(issueCount) {
  return PROPOSAL_TIERS.find((t) => issueCount <= t.maxIssues) || PROPOSAL_TIERS.at(-1);
}

function nextMonday(from = new Date()) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const add = (8 - d.getUTCDay()) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d;
}

function buildPlan(issues) {
  const start = nextMonday();
  return issues.slice(0, 12).map((iss, i) => {
    const week = Math.floor(i / 3) + 1;
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + (week - 1) * 7);
    return {
      week,
      issueId: iss.id,
      title: iss.title,
      detail: `${iss.detail}\n\nWhy: ${iss.why}`,
      actionType: ACTION_TYPES[iss.actionType] ? iss.actionType : "other",
      handledBy: iss.handledBy,
      plannedFor: date.toISOString().slice(0, 10),
    };
  });
}

function headlineParts({ name, comp, counts }) {
  const parts = [];
  const pos = comp.position;
  if (pos?.query) {
    parts.push(pos.rank
      ? `${name} appears #${pos.rank} in Google's results for “${pos.query}”.`
      : `${name} doesn't appear in the top ${pos.of || 20} of Google's results for “${pos.query}”.`);
  }
  const s = comp.stats;
  if (s && s.count >= 3 && comp.self && comp.self.reviews < s.medianReviews) {
    parts.push(`The ${s.count} nearest competitors have a median of ${s.medianReviews} Google reviews to your ${comp.self.reviews}.`);
  }
  parts.push(
    counts.total === 0
      ? "We didn't find a measurable gap worth charging you to fix."
      : `We found ${counts.total} issue${counts.total === 1 ? "" : "s"} holding you back and can fix ${
          counts.fixable === counts.total ? (counts.total === 1 ? "it" : `all ${counts.total}`) : `${counts.fixable} of them`
        }${counts.weDo > 0 ? ` — ${counts.weDo} without needing anything from you` : ""}.`
  );
  return parts;
}

function outboundMessage({ name, headline, url }) {
  return `Hi ${name} team — we looked at how you show up on Google Maps and AI search.\n\n${headline.join(" ")}\n\nYour free proposal, with the evidence and a 4-week plan: ${url}\n\n— Growlocal`;
}

export async function buildProposal({ input, website }) {
  const { place } = await resolvePlace(input);
  if (place.businessStatus === "CLOSED_PERMANENTLY") {
    throw new GbpAuditError("Google shows this business as permanently closed.", { code: "closed" });
  }

  const name = place.displayName?.text || "This business";
  const site = String(website || "").trim() || place.websiteUri || null;
  const rented = site && RENTED.test(hostOf(site));

  const [comp, webOutcome] = await Promise.all([
    discoverCompetitors(place),
    site && !rented
      ? runAudit(site).then((r) => ({ audit: r }), (e) => ({ error: e.message }))
      : Promise.resolve({ audit: rented ? "rented" : null }),
  ]);

  const gbp = scoreGbpProfile(place);
  const webAudit = webOutcome.audit;
  const category = place.primaryTypeDisplayName?.text || place.primaryType || place.types?.[0] || null;
  const area = place.formattedAddress || null;
  const issues = await prioritize(
    buildIssues({ place, gbp, comp, site, webAudit, webError: webOutcome.error }),
    { name, category, area },
  );

  const counts = {
    total: issues.length,
    weDo: issues.filter((i) => i.handledBy === "we_do").length,
    approve: issues.filter((i) => i.handledBy === "you_approve").length,
    help: issues.filter((i) => i.handledBy === "you_help").length,
  };
  counts.fixable = counts.weDo + counts.approve;

  const tier = tierFor(counts.total);
  const headline = headlineParts({ name, comp, counts });

  const limits = [
    "Positions come from one Google search for the phrase shown. Map Pack rank changes with where the customer is standing, so it isn't the same as your rank everywhere.",
    comp.self?.pace?.reviewsPer30Days != null
      ? `Review pace is measured from snapshots since ${comp.self.pace.measuredSince.slice(0, 10)}.`
      : "Review pace isn't measured yet. We've recorded today's review counts for you and your competitors, and pace will be measured from future snapshots.",
    "Google's API returns at most 10 photos per listing, so “10” means 10 or more.",
    "Categories are compared using the place types Google publishes, which closely track but don't exactly match Business Profile categories.",
    ...(webOutcome.error ? [`We couldn't fetch your website (${webOutcome.error}), so website issues aren't included.`] : []),
    ...comp.notes,
    ...GBP_NOT_ASSESSED.map((x) => `Not assessed: ${x}`),
  ];

  const id = crypto.randomBytes(9).toString("base64url");
  const url = `${BRAND.url}/p/${id}`;

  return {
    id,
    url,
    createdAt: new Date().toISOString(),
    input: String(input).slice(0, 300),
    place: {
      id: place.id,
      name,
      address: place.formattedAddress || null,
      category: place.primaryTypeDisplayName?.text || null,
      rating: place.rating ?? null,
      reviews: place.userRatingCount ?? 0,
      mapsUri: place.googleMapsUri || null,
      website: site,
    },
    scores: {
      gbp: gbp.score,
      website: webAudit?.scores ? { overall: webAudit.overall, SEO: webAudit.scores.SEO.score, AEO: webAudit.scores.AEO.score, GEO: webAudit.scores.GEO.score } : null,
    },
    competitors: comp.competitors,
    self: comp.self,
    stats: comp.stats,
    position: comp.position,
    issues,
    counts,
    tier: { id: tier.id, name: tier.name, price: tier.price, priceNumeric: tier.priceNumeric, pitch: tier.pitch },
    plan: buildPlan(issues),
    headline,
    outbound: outboundMessage({ name, headline, url }),
    limits,
  };
}

// ---------- storage ----------
const key = (id) => `proposal:${id}`;
const INDEX = "proposals:index";

export async function saveProposal(p) {
  await set(key(p.id), p);
  const index = (await get(INDEX)) || [];
  const entry = {
    id: p.id, name: p.place.name, address: p.place.address, createdAt: p.createdAt,
    total: p.counts.total, fixable: p.counts.fixable, tier: p.tier.name, outbound: p.outbound,
  };
  await set(INDEX, [entry, ...index.filter((x) => x.id !== p.id)].slice(0, 300));
  return p;
}

export async function getProposal(id) {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(String(id || ""))) return null;
  return (await get(key(id))) || null;
}

export async function listProposals() {
  return (await get(INDEX)) || [];
}
