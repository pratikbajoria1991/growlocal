// Growth Crew — a goal-driven team of agents that turns Growlocal's measured
// findings into reviewed, verified fixes.
//
//   Discover  measured issues (live Google + competitors + website audit)
//   Plan      lead strategist assigns issues to specialists for the goal
//   Do        GBP / SEO / AEO / GEO specialists work in parallel, with tools
//   Check     deterministic guardrail + fact-checker + Jev second opinion
//   Revise    one revision round for anything flagged, then re-checked
//   Prove     merged website edits are applied to a copy of the page and the
//             real audit is re-run: measured before/after, per-edit effect
//   Record    approved work goes to the ledger — risky changes wait for the owner
//
// A run is a job in stages. Each stage is one bounded step (well inside a
// serverless request limit), saved to the store before the next starts, so a
// run survives timeouts, can be retried stage by stage, and can be driven by
// a scheduler. runCrew() still runs every stage in one call for local use.
//
// The crew never writes to Google or a website itself. It produces ready-to-apply
// drafts and patches; what ships, and when, is governed by the ledger's risk tiers.

import crypto from "crypto";
import { buildProposal } from "../proposal";
import { resolvePlace } from "../gbp-audit";
import { runAuditOnHtml } from "../audit";
import { createAction } from "../ledger";
import { safeFetch } from "../safe-fetch";
import { get, set } from "../store";
import { runAgent, provider, MODEL } from "./llm";
import { AGENTS, routeIssue } from "./agents";
import { makeTools, scores } from "./tools";
import { applyEdits, describeEdits, jsonldTypes } from "./patch";
import { checkText, jevUnsupportedClaims } from "./guard";
import { alert } from "../notify";

const SITE_AGENTS = ["seo", "geo", "aeo"]; // priority order when two agents touch the same thing
const STAGES = ["discover", "specialists", "review", "revise", "prove", "done"];
const STAGE_MS = () => Number(process.env.CREW_STAGE_MS) || 200_000; // per stage, under Vercel's 300s
const RENTED = /instagram|facebook|linktr\.ee|practo|justdial|business\.site|sites\.google/i;

const jobKey = (id) => `crew:run:${id}`;

async function fetchSite(url) {
  if (!url || RENTED.test(url)) return null;
  try {
    const r = await safeFetch(url, { timeoutMs: 15_000, maxBytes: 1_500_000 });
    return r.ok && r.body ? { html: r.body, url: r.url } : null;
  } catch {
    return null; // blocked or unreachable: the crew works without a website
  }
}

function factSheet(place) {
  return {
    name: place.displayName?.text || null,
    address: place.formattedAddress || null,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    website: place.websiteUri || null,
    googleCategory: place.primaryTypeDisplayName?.text || null,
    googleTypes: (place.types || []).filter((t) => !["point_of_interest", "establishment"].includes(t)),
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? 0,
    openingHours: place.regularOpeningHours?.weekdayDescriptions || null,
    location: place.location ? { lat: place.location.latitude, lng: place.location.longitude } : null,
    googleMapsUrl: place.googleMapsUri || null,
    businessStatus: place.businessStatus || null,
  };
}

const EDIT_TYPE = { set_title: "site_technical", set_meta_description: "site_technical", set_canonical: "site_technical", add_jsonld: "site_schema", add_section_html: "site_page" };
const editText = (e) => (e.op === "add_section_html" ? `${e.html || ""} ${e.value || ""}` : e.value || "");
const idOf = (agent, i) => `${agent}-${i + 1}`;

// What each website specialist is allowed to change. Edits outside an
// agent's lane are dropped (and noted), so the SEO agent can't fill a page
// with schema blocks and the FAQ agent can't rewrite the title.
const LANES = {
  seo: { ops: ["set_title", "set_meta_description", "set_canonical"] },
  aeo: { ops: ["add_section_html", "add_jsonld"], jsonld: ["FAQPage", "WebPage", "QAPage"] },
  geo: { ops: ["add_section_html", "add_jsonld"], jsonld: null }, // any LocalBusiness subtype + supporting nodes
};
const GEO_TYPES = /LocalBusiness|Clinic|Dentist|Physician|Hospital|Store|Restaurant|Hotel|Service|Organization|Place|PostalAddress|GeoCoordinates|OpeningHoursSpecification|MedicalBusiness|HealthAndBeautyBusiness|BeautySalon|DaySpa|Optician|Pharmacy|AutoRepair|RealEstateAgent|LegalService|Attorney|AccountingService|HomeAndConstructionBusiness|Electrician|Plumber|Locksmith|MovingCompany|FoodEstablishment|Bakery|CafeOrCoffeeShop|LodgingBusiness|EducationalOrganization|School|BreadcrumbList|WebSite|WebPage/;
function inLane(agent, e) {
  const lane = LANES[agent];
  if (!lane || !lane.ops.includes(e.op)) return false;
  if (e.op !== "add_jsonld") return true;
  let types = [];
  try { types = jsonldTypes(JSON.parse(e.value)); } catch { return true; } // the patcher rejects bad JSON itself
  if (agent === "aeo") return types.every((t) => lane.jsonld.includes(t));
  if (agent === "geo") return types.length > 0 && types.every((t) => GEO_TYPES.test(t)) && !types.some((t) => /^(FAQPage|HowTo|Article|BlogPosting|Product|Review|AggregateRating)$/.test(t));
  return true;
}

function toItems(agent, out, ev = () => {}) {
  if (agent === "gbp") return (out.actions || []).map((a, i) => ({ id: idOf(agent, i), agent, kind: "gbp", type: a.type, title: a.title, content: a.content, rationale: a.rationale, issueIds: a.issue_ids || [], needsInput: out.needs_owner_input || [] }));
  const edits = (out.edits || []).filter((e) => {
    if (inLane(agent, e)) return true;
    let what = e.op;
    if (e.op === "add_jsonld") { try { what += ` (${jsonldTypes(JSON.parse(e.value)).join(", ")})`; } catch { /* keep op */ } }
    ev({ stage: "do", agent, msg: `Dropped an out-of-scope ${what} from ${agent}` });
    return false;
  });
  return edits.map((e, i) => ({ id: idOf(agent, i), agent, kind: "site_edit", type: EDIT_TYPE[e.op] || "other", title: describeEdits([e])[0], content: editText(e), rationale: e.rationale, issueIds: e.issue_ids || [], edit: e, needsInput: out.needs_owner_input || [] }));
}

// Everything a stage needs to call agents: tools over the saved context, the
// shared token budget, the trace, and this stage's deadline.
async function stageEnv(job, llm, preloaded) {
  const page = preloaded || (job.ctx.siteUrl ? await fetchSite(job.ctx.siteUrl) : null);
  const ctx = { ...job.ctx, html: page?.html || null };
  const deadline = Date.now() + STAGE_MS() - 20_000;
  const ev = (e) => job.trace.push({ at: new Date().toISOString(), ...e });
  const budget = job.budget;
  const agentRun = (name, cfg, prompt, tools) => {
    let timer;
    const cap = new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error(`${name} ran past the stage limit`), { code: "timeout" })), Math.max(5_000, deadline + 45_000 - Date.now()));
    });
    return Promise.race([runAgent({ name, ...cfg, prompt, tools, budget, onEvent: ev, llm, maxTurns: 8, deadline }), cap]).finally(() => clearTimeout(timer));
  };
  return { ctx, tools: makeTools(ctx), ev, agentRun, deadline };
}

// ---------- stages ----------

async function stageDiscover(job, llm) {
  const { input, website, goal } = job.params;
  const ev = (e) => job.trace.push({ at: new Date().toISOString(), ...e });
  ev({ stage: "discover", msg: "Measuring the business live (Google, competitors, website)" });
  const [proposal, { place }] = await Promise.all([buildProposal({ input, website }), resolvePlace(input)]);
  const facts = factSheet(place);
  const page = await fetchSite(proposal.place.website);
  job.place = proposal.place;
  job.business = facts.name;
  job.issues = proposal.issues;
  job.ctx = { facts, siteUrl: page?.url || null, ownerFacts: job.params.ownerFacts, comp: { stats: proposal.stats, competitors: (proposal.competitors || []).slice(0, 8), self: proposal.self } };
  ev({ stage: "discover", msg: `${job.issues.length} measured issues; website ${page ? "fetched" : "not available"}` });
  if (proposal.websiteAuditError) {
    job.websiteAuditError = proposal.websiteAuditError;
    ev({ stage: "discover", error: `Website audit failed (${proposal.websiteAuditError}), so website issues are missing from this run. Re-run when the site responds.` });
  }

  const { tools, agentRun } = await stageEnv(job, llm, page);
  const hasSite = Boolean(page);
  const issueBrief = job.issues.map((i) => ({ id: i.id, title: i.title, evidence: i.why, handledBy: i.handledBy, source: i.source }));
  const routable = job.issues.filter((i) => routeIssue(i) && (SITE_AGENTS.includes(routeIssue(i)) ? hasSite : true));
  let plan;
  try {
    const p = await agentRun("planner", AGENTS.planner(goal), `Business: ${facts.name} (${facts.googleCategory}).\nMeasured issues:\n${JSON.stringify(issueBrief, null, 1)}\n\nWebsite available to edit: ${hasSite ? "yes" : "no"}.\nAssign the issues the crew should work on.`, tools.filter((t) => ["get_facts", "get_competitors"].includes(t.name)));
    plan = p.data;
    // Safety net: the planner can't invent issue ids, and may only pick actionable ones.
    const valid = new Set(routable.map((i) => i.id));
    plan.assignments = plan.assignments.map((a) => ({ ...a, issue_ids: a.issue_ids.filter((x) => valid.has(x)) })).filter((a) => a.issue_ids.length && (a.agent === "gbp" || hasSite));
  } catch (e) {
    ev({ stage: "plan", msg: `Planner unavailable (${e.code || e.message}); using deterministic routing` });
    const by = {};
    for (const i of routable) (by[routeIssue(i)] ||= []).push(i.id);
    plan = { assignments: Object.entries(by).map(([agent, issue_ids], n) => ({ agent, issue_ids, priority: n + 1, reason: "deterministic routing" })), skipped: [], summary: "Routed by surface." };
  }
  // The planner sets priority and what to skip; ownership follows the
  // surface. An issue the planner gave to the wrong specialist moves to the
  // one that owns it (website schema -> geo, FAQ -> aeo, titles -> seo).
  const issueById = Object.fromEntries(job.issues.map((i) => [i.id, i]));
  for (const a of plan.assignments) {
    const keep = [];
    for (const x of a.issue_ids) {
      const owner = routeIssue(issueById[x]);
      if (!owner || owner === a.agent) { keep.push(x); continue; }
      const t = plan.assignments.find((y) => y.agent === owner);
      if (t) { if (!t.issue_ids.includes(x)) t.issue_ids.push(x); }
      else plan.assignments.push({ agent: owner, issue_ids: [x], priority: a.priority, reason: a.reason });
    }
    a.issue_ids = keep;
  }
  plan.assignments = plan.assignments.filter((a) => a.issue_ids.length);
  // Every routable issue reaches a specialist even if the planner dropped it.
  for (const i of routable) {
    const ag = routeIssue(i);
    if (plan.assignments.some((a) => a.issue_ids.includes(i.id))) continue;
    // A skipped website issue is the planner's call; a skipped profile issue
    // still gets owner-ready material from the GBP specialist.
    if (ag !== "gbp" && (plan.skipped || []).some((s) => s.issue_id === i.id)) continue;
    const a = plan.assignments.find((x) => x.agent === ag);
    if (a) a.issue_ids.push(i.id);
    else plan.assignments.push({ agent: ag, issue_ids: [i.id], priority: plan.assignments.length + 1, reason: "added by routing safety net" });
  }
  // One assignment per specialist: the planner may split an agent's work
  // into several, but each agent runs once over all its issues.
  const merged = {};
  for (const a of plan.assignments) {
    const m = (merged[a.agent] ||= { agent: a.agent, issue_ids: [], priority: a.priority, reasons: [] });
    m.issue_ids.push(...a.issue_ids.filter((x) => !m.issue_ids.includes(x)));
    m.priority = Math.min(m.priority, a.priority);
    if (a.reason) m.reasons.push(a.reason);
  }
  plan.assignments = Object.values(merged).sort((x, y) => x.priority - y.priority).map(({ reasons, ...m }) => ({ ...m, reason: reasons.join(" ") }));
  plan.skipped = (plan.skipped || []).filter((s) => !plan.assignments.some((a) => a.issue_ids.includes(s.issue_id)));
  job.plan = plan;
  job.handoffs = job.issues.filter((i) => !routeIssue(i) || (SITE_AGENTS.includes(routeIssue(i)) && !hasSite)).map((i) => ({ issueId: i.id, title: i.title, why: i.why, next: i.id === "no_website" || i.id === "rented_site" ? "Build an owned site (Growlocal site/preview generator) — needs the owner's OK before it goes live" : i.id === "web_https" ? "Owner/hosting change: enable HTTPS with the hosting provider" : "Needs the owner (e.g. collecting reviews) or a website we can edit" }));
  ev({ stage: "plan", msg: plan.summary, assignments: plan.assignments.map((a) => `${a.agent}: ${a.issue_ids.join(", ")}`) });
}

function specialistPrompt(job, a, feedback) {
  const byId = Object.fromEntries(job.issues.map((i) => [i.id, i]));
  return `Business: ${job.business}.\nIssues assigned to you (measured evidence):\n${a.issue_ids.map((x) => `- [${x}] ${byId[x]?.title} — ${byId[x]?.why}`).join("\n")}\n\nLead's note: ${a.reason}\n${feedback ? `\nYour previous draft was fact-checked and these items were flagged. Fix them (return the complete corrected output):\n${feedback}\n` : ""}\nProduce your output.`;
}
const toolsFor = (tools, agent) => tools.filter((t) => (agent === "gbp" ? !["get_page", "score_page_with_edits", "list_failing_checks"].includes(t.name) : true));

async function stageSpecialists(job, llm) {
  const { tools, ev, agentRun } = await stageEnv(job, llm);
  const goal = job.params.goal;
  const outputs = {};
  await Promise.all(job.plan.assignments.map(async (a) => {
    try { outputs[a.agent] = (await agentRun(a.agent, AGENTS[a.agent](goal), specialistPrompt(job, a), toolsFor(tools, a.agent))).data; }
    catch (e) { ev({ stage: "do", agent: a.agent, error: e.message }); }
  }));
  job.items = SITE_AGENTS.concat("gbp").flatMap((ag) => (outputs[ag] ? toItems(ag, outputs[ag], ev) : []));
  ev({ stage: "do", msg: `${job.items.length} drafted items from ${Object.keys(outputs).join(", ") || "no specialist"}` });
}

async function reviewItems(job, env, items) {
  if (!items.length) return;
  const { tools, ev, agentRun } = env;
  const facts = job.ctx.facts, ownerFacts = job.params.ownerFacts;
  // One reviewer call per specialist's batch, in parallel.
  const verdicts = {};
  const batches = Object.values(items.reduce((m, x) => ((m[x.agent] ||= []).push(x), m), {}));
  await Promise.all(batches.map(async (batch) => {
    try {
      const r = await agentRun("reviewer", AGENTS.reviewer(), `Check these drafted items against the facts. Items:\n${JSON.stringify(batch.map((x) => ({ id: x.id, type: x.type, text: x.content, rationale: x.rationale })), null, 1)}`, tools.filter((t) => ["get_facts", "get_competitors"].includes(t.name)));
      for (const v of r.data.verdicts || []) verdicts[v.id] = v;
    } catch (e) { ev({ stage: "check", msg: `Reviewer unavailable for ${batch[0].agent} (${e.code || e.message}) — those items held for human review` }); }
  }));
  await Promise.all(items.map(async (it) => {
    const det = checkText(it.content, facts, ownerFacts);
    const jev = it.content.length > 30 ? await jevUnsupportedClaims(it.content, facts, ownerFacts) : null;
    const v = verdicts[it.id];
    it.checks = { deterministic: det, reviewer: v || null, jev };
    it.needsInput = [...new Set([...(it.needsInput || []), ...det.needsInput])];
    if (det.problems.length || v?.status === "reject") it.status = "rejected";
    else if (!v) it.status = "held"; // no independent reviewer verdict -> never auto-approve
    else if (v.status === "revise" || (jev && jev.confidence >= 0.6 && jev.score >= 0.6)) it.status = "revise";
    // Honest but incomplete: it can't ship with <FILL: ...> placeholders in it,
    // and a draft that is only a request to the owner isn't work to ship.
    // Both wait for the owner's details, which the next run fills in.
    else if (/<FILL:/i.test(it.content)) it.status = "needs_input";
    else if (/^\s*(please\s+)?(provide|share|send|confirm|tell us|let us know)\b/i.test(it.content) && it.content.length < 400) {
      it.status = "needs_input";
      it.needsInput = [...new Set([...(it.needsInput || []), it.content.trim()])];
    }
    else it.status = "approved";
  }));
}

async function stageReview(job, llm) {
  const env = await stageEnv(job, llm);
  env.ev({ stage: "check", msg: `${job.items.length} drafted items under review` });
  await reviewItems(job, env, job.items);
}

async function stageRevise(job, llm) {
  const env = await stageEnv(job, llm);
  const { tools, ev, agentRun } = env;
  const flagged = [...new Set(job.items.filter((i) => ["revise", "rejected"].includes(i.status) && i.checks.deterministic.problems.concat(i.checks.reviewer?.problems || []).length).map((i) => i.agent))];
  if (!flagged.length) { ev({ stage: "revise", msg: "Nothing flagged; no revision needed" }); return; }
  ev({ stage: "revise", msg: `Revising work from ${flagged.join(", ")}` });
  const fresh = [];
  await Promise.all(flagged.map(async (ag) => {
    const a = job.plan.assignments.find((x) => x.agent === ag);
    if (!a) return;
    const feedback = job.items.filter((i) => i.agent === ag && i.status !== "approved").map((i) => `- ${i.title}: ${[...i.checks.deterministic.problems, ...(i.checks.reviewer?.problems || []), ...(i.checks.reviewer?.unsupported_claims || []).map((c) => `unsupported: ${c}`)].join("; ")}`).join("\n");
    try {
      const out = (await agentRun(ag, AGENTS[ag](job.params.goal), specialistPrompt(job, a, feedback), toolsFor(tools, ag))).data;
      fresh.push(...toItems(ag, out, ev).map((x) => ({ ...x, id: `${x.id}r`, revised: true })));
    } catch (e) { ev({ stage: "revise", agent: ag, error: `revision failed: ${e.message}` }); }
  }));
  await reviewItems(job, env, fresh);
  // A revision replaces its agent's flagged items. Items already approved
  // survive unless the revision redoes the same kind of change.
  const sig = (i) => `${i.kind}:${i.type}:${i.edit?.op || ""}`;
  const revisedAgents = new Set(fresh.map((x) => x.agent));
  const redone = new Set(fresh.map(sig));
  job.items = [...job.items.filter((i) => !revisedAgents.has(i.agent) || (i.status === "approved" && !redone.has(sig(i)))), ...fresh];
}

async function stageProve(job, llm) {
  const { ctx, ev } = await stageEnv(job, llm);
  const items = job.items;
  const siteItems = items.filter((i) => i.kind === "site_edit" && i.status === "approved");
  if (ctx.html && siteItems.length) {
    const origin = new URL(ctx.siteUrl).origin;
    const taken = new Set(), merged = [];
    for (const ag of SITE_AGENTS) for (const it of siteItems.filter((x) => x.agent === ag)) {
      let key = it.edit.op;
      if (key === "add_jsonld") { try { key = `jsonld:${jsonldTypes(JSON.parse(it.edit.value)).sort().join("+")}`; } catch { key = `jsonld:?${it.id}`; } }
      if (key !== "add_section_html" && taken.has(key)) { it.status = "superseded"; continue; }
      taken.add(key); merged.push(it);
    }
    const before = await runAuditOnHtml(ctx.html, ctx.siteUrl);
    const patched = applyEdits(ctx.html, merged.map((m) => m.edit), { origin });
    const after = await runAuditOnHtml(patched.html, ctx.siteUrl);
    const perEdit = [];
    for (const m of merged) {
      const solo = applyEdits(ctx.html, [m.edit], { origin });
      const a = await runAuditOnHtml(solo.html, ctx.siteUrl);
      m.measuredDelta = a.overall - before.overall; m.rejectedByPatcher = solo.rejected[0]?.reason || null;
      perEdit.push({ id: m.id, edit: describeEdits([m.edit])[0], delta: m.measuredDelta, rejected: m.rejectedByPatcher });
      if (m.rejectedByPatcher) m.status = "rejected";
      else if (m.measuredDelta < 0) m.status = "held"; // measurably makes the audit worse
    }
    const regress = after.overall < before.overall;
    if (regress) for (const m of merged) if (m.status === "approved") m.status = "held";
    job.verification = { before: scores(before), after: scores(after), delta: after.overall - before.overall, perEdit, patcherRejected: patched.rejected, regress, patchedHtmlBytes: patched.html.length, patchedHtmlKey: `crew:patch:${job.id}` };
    ev({ stage: "prove", msg: `Website audit ${before.overall} -> ${after.overall} (${after.overall - before.overall >= 0 ? "+" : ""}${after.overall - before.overall})` });
    await set(job.verification.patchedHtmlKey, { html: patched.html, edits: merged.filter((m) => m.status === "approved").map((m) => m.edit) });
  }

  // ---- Record ----
  const issueById = Object.fromEntries(job.issues.map((i) => [i.id, i]));
  const evidenceFor = (it) => it.issueIds.map((x) => issueById[x]?.title).filter(Boolean).join("; ");
  const { clientId, dispatch } = job.params;
  for (const it of items) {
    if (it.status !== "approved") continue;
    it.ledger = { type: it.type, title: it.title.slice(0, 140), detail: `${it.content}\n\nWhy: ${it.rationale}\nFixes: ${evidenceFor(it)}${it.needsInput?.length ? `\nNeeds from owner: ${it.needsInput.join("; ")}` : ""}${it.measuredDelta != null ? `\nMeasured: website audit ${it.measuredDelta >= 0 ? "+" : ""}${it.measuredDelta} points on its own` : ""}` };
    if (dispatch && clientId) { try { const a = await createAction(clientId, it.ledger); it.ledgerActionId = a.id; it.ledgerStatus = a.status; } catch (e) { it.ledgerError = e.message; } }
  }
}

const RUNNERS = { discover: stageDiscover, specialists: stageSpecialists, review: stageReview, revise: stageRevise, prove: stageProve };

function summarize(job) {
  const items = job.items || [];
  return {
    issues: (job.issues || []).length, drafted: items.length,
    approved: items.filter((i) => i.status === "approved").length, held: items.filter((i) => i.status === "held").length,
    needsInput: items.filter((i) => i.status === "needs_input").length,
    ownerQuestions: [...new Set(items.filter((i) => i.status === "needs_input").flatMap((i) => i.needsInput || []))],
    rejected: items.filter((i) => i.status === "rejected").length, superseded: items.filter((i) => i.status === "superseded").length,
    handedOff: (job.handoffs || []).length,
  };
}

// The stored job, shaped for the API: no raw edits (the patch holds those).
export function publicRun(job) {
  return {
    id: job.id, status: job.status, stage: job.stage, error: job.error || null, createdAt: job.createdAt, updatedAt: job.updatedAt,
    durationMs: job.durationMs ?? null, goal: job.params.goal, business: job.business || null, place: job.place || null,
    clientId: job.params.clientId, dispatched: Boolean(job.params.dispatch && job.params.clientId), provider: job.provider, model: job.model,
    plan: job.plan || null, handoffs: job.handoffs || [], items: (job.items || []).map(({ edit, ...rest }) => ({ ...rest, edit: edit ? { op: edit.op } : undefined })),
    websiteAuditError: job.websiteAuditError || null, verification: job.verification || null, usage: { tokens: job.budget.used, budget: job.budget.tokens }, summary: summarize(job), trace: job.trace,
  };
}

/** Creates a crew job and saves it. Run its stages with advanceCrew(id). */
export async function startCrew({ input, website = "", goal, ownerFacts = "", clientId = null, dispatch = false, budgetTokens }) {
  const id = crypto.randomBytes(8).toString("base64url");
  const now = new Date().toISOString();
  const job = {
    id, createdAt: now, updatedAt: now, status: "running", stage: "discover", attempts: {},
    params: { input, website, goal, ownerFacts, clientId, dispatch },
    provider: provider(), model: provider() ? MODEL() : null,
    budget: { tokens: budgetTokens || Number(process.env.CREW_BUDGET_TOKENS) || 600_000, used: 0 },
    trace: [], items: [],
  };
  await set(jobKey(id), job);
  const index = (await get("crew:runs")) || [];
  await set("crew:runs", [{ id, at: now, business: null, goal, status: "running" }, ...index].slice(0, 200));
  return job;
}

/**
 * Runs the job's next stage and saves the result. A failing stage is retried
 * on the next call (up to 2 attempts), then the job is marked failed.
 * @returns {Promise<object>} the saved job
 */
export async function advanceCrew(id, { llm = null } = {}) {
  const job = await get(jobKey(id));
  if (!job) throw Object.assign(new Error("Run not found."), { code: "not_found" });
  if (job.status !== "running") return job;
  // One stage at a time: a second caller (retry, duplicate trigger) backs off.
  if (job.lockUntil && Date.parse(job.lockUntil) > Date.now()) return job;
  const stage = job.stage;
  const t0 = Date.now();
  job.lockUntil = new Date(t0 + STAGE_MS() + 30_000).toISOString();
  await set(jobKey(id), job);
  try {
    await RUNNERS[stage](job, llm);
    job.stage = STAGES[STAGES.indexOf(stage) + 1];
    job.trace.push({ at: new Date().toISOString(), stage: "timing", msg: `${stage} took ${Math.round((Date.now() - t0) / 1000)}s` });
    if (job.stage === "done") {
      job.status = "done";
      job.durationMs = Date.now() - new Date(job.createdAt).getTime();
    }
  } catch (e) {
    job.attempts[stage] = (job.attempts[stage] || 0) + 1;
    job.trace.push({ at: new Date().toISOString(), stage, error: `stage failed (attempt ${job.attempts[stage]}): ${e.message}` });
    if (job.attempts[stage] >= 2) {
      job.status = "failed"; job.error = `${stage}: ${e.message}`;
      await alert({ source: "crew", title: `Crew run failed at "${stage}"`, detail: `Run ${id}${job.business ? ` for ${job.business}` : ""}: ${e.message}`, clientId: job.params?.clientId || null });
    }
  }
  job.updatedAt = new Date().toISOString();
  job.lockUntil = null;
  await set(jobKey(id), job);
  if (job.status !== "running") {
    const index = (await get("crew:runs")) || [];
    await set("crew:runs", index.map((r) => (r.id === id ? { ...r, business: job.business, status: job.status, summary: summarize(job), delta: job.verification?.delta ?? null } : r)));
  }
  return job;
}

/** All stages in one call (local runs and tests). */
export async function runCrew(params) {
  let job = await startCrew(params);
  while (job.status === "running") job = await advanceCrew(job.id, { llm: params.llm || null });
  return publicRun(job);
}

export const getCrewRun = async (id) => { const j = await get(jobKey(id)); return j ? publicRun(j) : null; };
export const listCrewRuns = async () => (await get("crew:runs")) || [];
export const getCrewPatch = (id) => get(`crew:patch:${id}`);

/**
 * Quality and cost across recent finished runs: per agent, how much of its
 * work passed review, and per run, tokens, time and measured audit change.
 */
export async function crewStats(limit = 25) {
  const index = (await listCrewRuns()).filter((r) => r.status === "done").slice(0, limit);
  const runs = (await Promise.all(index.map((r) => get(jobKey(r.id))))).filter(Boolean);
  const agents = {};
  for (const j of runs) for (const it of j.items || []) {
    const a = (agents[it.agent] ||= { agent: it.agent, drafted: 0, approved: 0, needsInput: 0, revise: 0, rejected: 0, held: 0, superseded: 0 });
    a.drafted++;
    const k = { approved: "approved", needs_input: "needsInput", revise: "revise", rejected: "rejected", held: "held", superseded: "superseded" }[it.status];
    if (k) a[k]++;
  }
  const avg = (xs) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null);
  const deltas = runs.map((j) => j.verification?.delta).filter((x) => typeof x === "number");
  return {
    runs: runs.length,
    avgTokens: avg(runs.map((j) => j.budget?.used || 0)),
    avgSeconds: avg(runs.map((j) => Math.round((j.durationMs || 0) / 1000)).filter(Boolean)),
    avgAuditDelta: deltas.length ? Math.round((deltas.reduce((s, x) => s + x, 0) / deltas.length) * 10) / 10 : null,
    providers: runs.reduce((m, j) => ((m[`${j.provider || "?"} · ${j.model || "?"}`] = (m[`${j.provider || "?"} · ${j.model || "?"}`] || 0) + 1), m), {}),
    agents: Object.values(agents).map((a) => ({ ...a, approvalRate: a.drafted ? Math.round((a.approved / a.drafted) * 100) : null })),
  };
}
