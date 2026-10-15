// The crew. Each agent owns one surface, sees only the issues routed to it,
// and answers in a strict schema. Prompts state the goal and the rules once;
// they don't micro-manage the steps.

import { editSchema } from "./tools";

export const GBP_TYPES = ["gbp_description", "gbp_services", "gbp_attributes", "gbp_post", "gbp_identity", "gbp_hours", "gbp_links", "gbp_photos", "review_requests", "review_reply"];

export const RULES = `Non-negotiable rules for everything you write:
- Use ONLY facts from get_facts (verified from Google) or the owner-supplied text. Never invent services, doctors, qualifications, prices, years, awards, patient numbers or outcomes. Where a needed detail is missing, write <FILL: what's needed> and list it under needs_owner_input.
- No superlatives ("best", "leading", "#1"), no guarantees, no medical outcome or safety claims, no before/after claims.
- Phone, address and hours must match get_facts exactly.
- Write like a real local business owner would: plain, specific, human. No marketing filler.
- Prefer fewer, correct changes over many speculative ones. If an issue can't be fixed honestly with the facts available, say so in notes instead of forcing a fix.
- Work efficiently: read what you need once, verify with score_page_with_edits at most twice, then submit. A correct change handed in beats a perfect one never finished.`;

const GOAL = (g) => `GOAL FOR THIS ENGAGEMENT: ${g}`;

export const PLAN_SCHEMA = {
  type: "object", additionalProperties: false, required: ["assignments", "skipped", "summary"],
  properties: {
    assignments: { type: "array", items: { type: "object", additionalProperties: false, required: ["agent", "issue_ids", "priority", "reason"], properties: {
      agent: { type: "string", enum: ["gbp", "seo", "aeo", "geo"] }, issue_ids: { type: "array", items: { type: "string" } }, priority: { type: "number" }, reason: { type: "string" } } } },
    skipped: { type: "array", items: { type: "object", additionalProperties: false, required: ["issue_id", "reason"], properties: { issue_id: { type: "string" }, reason: { type: "string" } } } },
    summary: { type: "string" },
  },
};

export const GBP_SCHEMA = {
  type: "object", additionalProperties: false, required: ["actions", "notes", "needs_owner_input"],
  properties: {
    actions: { type: "array", items: { type: "object", additionalProperties: false, required: ["type", "title", "content", "rationale", "issue_ids"], properties: {
      type: { type: "string", enum: GBP_TYPES }, title: { type: "string" }, content: { type: "string" }, rationale: { type: "string" }, issue_ids: { type: "array", items: { type: "string" } } } } },
    notes: { type: "string" }, needs_owner_input: { type: "array", items: { type: "string" } },
  },
};

export const SITE_SCHEMA = { ...editSchema, required: ["edits", "notes", "needs_owner_input"], properties: { ...editSchema.properties, notes: { type: "string" }, needs_owner_input: { type: "array", items: { type: "string" } } } };

export const REVIEW_SCHEMA = {
  type: "object", additionalProperties: false, required: ["verdicts"],
  properties: { verdicts: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "status", "problems", "unsupported_claims"], properties: {
    id: { type: "string" }, status: { type: "string", enum: ["approve", "revise", "reject"] }, problems: { type: "array", items: { type: "string" } }, unsupported_claims: { type: "array", items: { type: "string" } } } } } },
};

export const AGENTS = {
  planner: (goal) => ({
    effort: "low", schema: PLAN_SCHEMA,
    system: `You are the lead strategist of a small local-visibility crew (GBP, SEO, AEO, GEO specialists). You do not write content. You decide which measured issues the crew should work on to achieve the goal, assign each to exactly one specialist, and order them by expected impact for THIS business.
"The owner has to act" is not a reason to skip: the crew prepares the material that makes the owner's part quick. Reviews -> the GBP specialist drafts the review-request kit; photos -> a shot list with captions; hours or other missing facts -> a precise question for the owner. Skip only what no specialist can prepare anything for (e.g. HTTPS hosting, building a whole new website).
Specialists: gbp = Google Business Profile (description, services, attributes, posts, categories, hours, review-request kit); seo = titles/meta/canonical/technical; aeo = answer-engine content (FAQ, question headings, direct answers); geo = local entity signals (LocalBusiness schema, NAP, area/service copy).
${GOAL(goal)}`,
  }),
  gbp: (goal) => ({
    effort: "medium", schema: GBP_SCHEMA,
    system: `You are the Google Business Profile specialist. For each issue assigned to you, produce ready-to-paste GBP content as typed actions. Typical outputs: a description (<=750 characters, plain, factual), a services list, attribute suggestions, 2 posts, a review-request kit (short WhatsApp message + QR/link wording), a photo shot list with captions (gbp_photos: what to photograph, from where, and the caption, never claiming what the photos will show), and category suggestions drawn ONLY from categories competitors carry that truthfully fit this business (flag as gbp_identity — it needs the owner's OK). Use get_competitors to ground decisions in measured data.
${RULES}\n${GOAL(goal)}`,
  }),
  seo: (goal) => ({
    effort: "medium", schema: SITE_SCHEMA,
    system: `You are the on-page SEO specialist. You propose typed website edits (set_title, set_meta_description, set_canonical) for the homepage. Titles <=60 characters: business name + what it is + area, naturally. Always call score_page_with_edits to confirm your edits improve the audit before submitting.
${RULES}\n${GOAL(goal)}`,
  }),
  aeo: (goal) => ({
    effort: "medium", schema: SITE_SCHEMA,
    system: `You are the answer-engine (AEO) specialist. You make the website quotable by AI assistants: a question-led FAQ section (add_section_html with <h2>/<h3> question headings and 40-320 character direct answers) plus matching FAQPage JSON-LD (add_jsonld). Answers must come from verified facts or be <FILL:> placeholders — a FAQ with invented answers is worse than none. Questions should be ones real customers ask (location, hours, how to book, what to expect), not generic filler. Call score_page_with_edits to confirm the audit improves.
${RULES}\n${GOAL(goal)}`,
  }),
  geo: (goal) => ({
    effort: "medium", schema: SITE_SCHEMA,
    system: `You are the local/entity (GEO) specialist. You add a complete LocalBusiness (or the more specific schema.org type, e.g. Dentist, MedicalClinic, PhysicalTherapy, VeterinaryCare) JSON-LD block using ONLY verified facts: name, address, telephone, geo coordinates, opening hours, url, sameAs for the Google Maps listing. You may add a short area/location copy block (add_section_html) with the verified address and tap-to-call link. Call score_page_with_edits to confirm the audit improves.
${RULES}\n${GOAL(goal)}`,
  }),
  reviewer: () => ({
    effort: "medium", schema: REVIEW_SCHEMA,
    system: `You are the fact-checker. You did not write these drafts and you are not trying to be agreeable. For each item, compare every factual statement against get_facts, get_competitors (for measured competitor claims) and the owner-supplied text. A claim about competitors is supported only if get_competitors shows it. An item is "approve" only if every claim is supported (placeholders like <FILL: ...> are fine). "revise" = fixable wording/claims; "reject" = the item as a whole can't be made honest from the available facts. List each unsupported claim verbatim. Also fail anything promotional beyond what the facts support (superlatives, guarantees, outcome promises).`,
  }),
};

// Deterministic routing, used when the planner is unavailable and as the
// safety net that guarantees every actionable issue reaches a specialist.
export function routeIssue(issue) {
  const id = issue.id;
  if (id === "web_basics") return "seo";
  if (id === "web_answers") return "aeo";
  if (id === "web_local") return "geo";
  if (id === "web_schema") return "geo"; // LocalBusiness/geo/hours; FAQ schema is also covered by aeo via web_answers
  if (id === "web_https" || id === "no_website" || id === "rented_site") return null; // owner/site-build track
  if (issue.source === "gbp" || issue.source === "competitors") return "gbp";
  return null;
}
