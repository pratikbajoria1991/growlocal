// Growth Crew — a goal-driven team of agents that turns Growlocal's measured
// findings into reviewed, verified fixes.
//
//   Discover  measured issues (live Google + competitors + website audit)
//   Plan      lead strategist assigns issues to specialists for the goal
//   Do        GBP / SEO / AEO / GEO specialists work in parallel, with tools
//   Check     deterministic guardrail + Claude fact-checker + Jev second opinion;
//             one revision round for anything flagged
//   Prove     merged website edits are applied to a copy of the page and the
//             real audit is re-run: measured before/after, per-edit effect
//   Record    approved work goes to the ledger — risky changes wait for the owner
//
// The crew never writes to Google or a website itself. It produces ready-to-apply
// drafts and patches; what ships, and when, is governed by the ledger's risk tiers.

import crypto from "crypto";
import dns from "dns/promises";
import net from "net";
import { buildProposal } from "../proposal";
import { resolvePlace } from "../gbp-audit";
import { runAuditOnHtml } from "../audit";
import { createAction } from "../ledger";
import { get, set } from "../store";
import { runAgent } from "./llm";
import { AGENTS, routeIssue } from "./agents";
import { makeTools, scores, summarizePage } from "./tools";
import { applyEdits, describeEdits } from "./patch";
import { checkText, jevUnsupportedClaims } from "./guard";

const SITE_AGENTS = ["seo", "geo", "aeo"]; // priority order when two agents touch the same thing

// ---------- fetching the owner's site, safely ----------
const PRIVATE = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|::1|fc|fd|fe80)/i;
async function safeFetchHtml(url) {
  let u; try { u = new URL(/^https?:/i.test(url) ? url : `https://${url}`); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  try {
    const addrs = net.isIP(u.hostname) ? [{ address: u.hostname }] : await dns.lookup(u.hostname, { all: true });
    if (addrs.some((a) => PRIVATE.test(a.address))) return null;
  } catch { return null; }
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(u.href, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; GrowlocalBot/1.0; +https://growlocal.vercel.app/audit)" } });
    if (!res.ok) return null;
    const html = await res.text();
    return { html: html.slice(0, 1_500_000), url: res.url || u.href };
  } catch { return null; } finally { clearTimeout(t); }
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

function toItems(agent, out) {
  if (agent === "gbp") return (out.actions || []).map((a, i) => ({ id: idOf(agent, i), agent, kind: "gbp", type: a.type, title: a.title, content: a.content, rationale: a.rationale, issueIds: a.issue_ids || [], needsInput: out.needs_owner_input || [] }));
  return (out.edits || []).map((e, i) => ({ id: idOf(agent, i), agent, kind: "site_edit", type: EDIT_TYPE[e.op] || "other", title: describeEdits([e])[0], content: editText(e), rationale: e.rationale, issueIds: e.issue_ids || [], edit: e, needsInput: out.needs_owner_input || [] }));
}

/**
 * @param {object} p
 * @param {string} p.input   Google Maps link or "business name, area"
 * @param {string} [p.website]
 * @param {string} p.goal    what the owner wants, in plain words
 * @param {string} [p.ownerFacts] facts the owner supplied (services, doctors, hours notes…)
 * @param {string} [p.clientId] when set (and dispatch true) approved work is written to this client's ledger
 * @param {boolean} [p.dispatch]
 * @param {Function} [p.llm]   test seam (see llm.js)
 */
export async function runCrew({ input, website = "", goal, ownerFacts = "", clientId = null, dispatch = false, llm = null, budgetTokens }) {
  const id = crypto.randomBytes(8).toString("base64url");
  const trace = [];
  const ev = (e) => trace.push({ at: new Date().toISOString(), ...e });
  const budget = { tokens: budgetTokens || Number(process.env.CREW_BUDGET_TOKENS) || 600_000, used: 0 };
  const agentRun = (name, cfg, prompt, tools) => runAgent({ name, ...cfg, prompt, tools, budget, onEvent: ev, llm, maxTurns: 10 });

  // ---- Discover ----
  ev({ stage: "discover", msg: "Measuring the business live (Google, competitors, website)" });
  const [proposal, { place }] = await Promise.all([buildProposal({ input, website }), resolvePlace(input)]);
  const facts = factSheet(place);
  const site = proposal.place.website;
  const fetched = site && !/instagram|facebook|linktr\.ee|practo|justdial|business\.site|sites\.google/i.test(site) ? await safeFetchHtml(site) : null;
  const ctx = { facts, html: fetched?.html || null, siteUrl: fetched?.url || null, ownerFacts, comp: { stats: proposal.stats, competitors: (proposal.competitors || []).slice(0, 8), self: proposal.self } };
  const tools = makeTools(ctx);
  const issues = proposal.issues;
  ev({ stage: "discover", msg: `${issues.length} measured issues; website ${ctx.html ? "fetched" : "not available"}` });

  // ---- Plan ----
  let plan;
  const issueBrief = issues.map((i) => ({ id: i.id, title: i.title, evidence: i.why, handledBy: i.handledBy, source: i.source }));
  const routable = issues.filter((i) => routeIssue(i) && (SITE_AGENTS.includes(routeIssue(i)) ? ctx.html : true));
  try {
    const p = await agentRun("planner", AGENTS.planner(goal), `Business: ${facts.name} (${facts.googleCategory}).\nMeasured issues:\n${JSON.stringify(issueBrief, null, 1)}\n\nWebsite available to edit: ${ctx.html ? "yes" : "no"}.\nAssign the issues the crew should work on.`, tools.filter((t) => ["get_facts", "get_competitors"].includes(t.name)));
    plan = p.data;
    // Safety net: planner can't invent issue ids, and may only pick actionable ones.
    const valid = new Set(routable.map((i) => i.id));
    plan.assignments = plan.assignments.map((a) => ({ ...a, issue_ids: a.issue_ids.filter((x) => valid.has(x)) })).filter((a) => a.issue_ids.length && (a.agent === "gbp" || ctx.html));
  } catch (e) {
    ev({ stage: "plan", msg: `Planner unavailable (${e.code || e.message}); using deterministic routing` });
    const by = {}; for (const i of routable) (by[routeIssue(i)] ||= []).push(i.id);
    plan = { assignments: Object.entries(by).map(([agent, issue_ids], n) => ({ agent, issue_ids, priority: n + 1, reason: "deterministic routing" })), skipped: [], summary: "Routed by surface." };
  }
  const handoffs = issues.filter((i) => !routeIssue(i) || (SITE_AGENTS.includes(routeIssue(i)) && !ctx.html)).map((i) => ({ issueId: i.id, title: i.title, why: i.why, next: i.id === "no_website" || i.id === "rented_site" ? "Build an owned site (Growlocal site/preview generator) — needs the owner's OK before it goes live" : i.id === "web_https" ? "Owner/hosting change: enable HTTPS with the hosting provider" : "Needs the owner (e.g. collecting reviews) or a website we can edit" }));
  ev({ stage: "plan", msg: plan.summary, assignments: plan.assignments.map((a) => `${a.agent}: ${a.issue_ids.join(", ")}`) });

  // ---- Do (specialists in parallel) ----
  const issueById = Object.fromEntries(issues.map((i) => [i.id, i]));
  const specialistPrompt = (a, feedback) => `Business: ${facts.name}.\nIssues assigned to you (measured evidence):\n${a.issue_ids.map((x) => `- [${x}] ${issueById[x].title} — ${issueById[x].why}`).join("\n")}\n\nLead's note: ${a.reason}\n${feedback ? `\nYour previous draft was fact-checked and these items were flagged. Fix them (return the complete corrected output):\n${feedback}\n` : ""}\nProduce your output.`;
  const runSpecialist = (a, feedback) => agentRun(a.agent, AGENTS[a.agent](goal), specialistPrompt(a, feedback), tools.filter((t) => a.agent === "gbp" ? !["get_page", "score_page_with_edits", "list_failing_checks"].includes(t.name) : true));
  const outputs = {};
  await Promise.all(plan.assignments.map(async (a) => { try { outputs[a.agent] = (await runSpecialist(a)).data; } catch (e) { ev({ stage: "do", agent: a.agent, error: e.message }); outputs[a.agent] = null; } }));

  // ---- Check ----
  async function review(items) {
    if (!items.length) return;
    let verdicts = {};
    try {
      const r = await agentRun("reviewer", AGENTS.reviewer(), `Check these drafted items against the facts. Items:\n${JSON.stringify(items.map((x) => ({ id: x.id, type: x.type, text: x.content, rationale: x.rationale })), null, 1)}`, tools.filter((t) => t.name === "get_facts"));
      verdicts = Object.fromEntries(r.data.verdicts.map((v) => [v.id, v]));
    } catch (e) { ev({ stage: "check", msg: `Reviewer unavailable (${e.code || e.message}) — items held for human review` }); }
    await Promise.all(items.map(async (it) => {
      const det = checkText(it.content, facts, ownerFacts);
      const jev = it.content.length > 30 ? await jevUnsupportedClaims(it.content, facts, ownerFacts) : null;
      const v = verdicts[it.id];
      it.checks = { deterministic: det, reviewer: v || null, jev };
      it.needsInput = [...new Set([...(it.needsInput || []), ...det.needsInput])];
      if (det.problems.length || v?.status === "reject") it.status = "rejected";
      else if (!v) it.status = "held";                       // no independent reviewer verdict -> never auto-approve
      else if (v.status === "revise" || (jev && jev.confidence >= 0.6 && jev.score >= 0.6)) it.status = "revise";
      else it.status = "approved";
    }));
  }
  const items = SITE_AGENTS.concat("gbp").flatMap((ag) => (outputs[ag] ? toItems(ag, outputs[ag]) : []));
  ev({ stage: "check", msg: `${items.length} drafted items under review` });
  await review(items);

  // one revision round for flagged items
  const flaggedAgents = [...new Set(items.filter((i) => ["revise", "rejected"].includes(i.status) && i.checks.deterministic.problems.concat(i.checks.reviewer?.problems || []).length).map((i) => i.agent))];
  for (const ag of flaggedAgents) {
    const a = plan.assignments.find((x) => x.agent === ag); if (!a) continue;
    const feedback = items.filter((i) => i.agent === ag && i.status !== "approved").map((i) => `- ${i.title}: ${[...i.checks.deterministic.problems, ...(i.checks.reviewer?.problems || []), ...(i.checks.reviewer?.unsupported_claims || []).map((c) => `unsupported: ${c}`)].join("; ")}`).join("\n");
    try {
      const out = (await runSpecialist(a, feedback)).data;
      const fresh = toItems(ag, out).map((x) => ({ ...x, revised: true }));
      const keep = items.filter((i) => i.agent !== ag); // the specialist returns its complete corrected output
      items.length = 0; items.push(...keep, ...fresh);
      await review(fresh);
    } catch (e) { ev({ stage: "check", agent: ag, error: `revision failed: ${e.message}` }); }
  }

  // ---- Prove (website) ----
  let verification = null;
  const siteItems = items.filter((i) => i.kind === "site_edit" && i.status === "approved");
  if (ctx.html && siteItems.length) {
    const origin = new URL(ctx.siteUrl).origin;
    const taken = new Set(), merged = [];
    for (const ag of SITE_AGENTS) for (const it of siteItems.filter((x) => x.agent === ag)) {
      let key = it.edit.op;
      if (key === "add_jsonld") { try { key = `jsonld:${JSON.parse(it.edit.value)["@type"]}`; } catch { key = `jsonld:?${it.id}`; } }
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
    verification = { before: scores(before), after: scores(after), delta: after.overall - before.overall, perEdit, patcherRejected: patched.rejected, regress, patchedHtmlBytes: patched.html.length };
    ev({ stage: "prove", msg: `Website audit ${before.overall} -> ${after.overall} (${after.overall - before.overall >= 0 ? "+" : ""}${after.overall - before.overall})` });
    // The shippable artifact: the patched page and the edit list.
    verification.patchedHtmlKey = `crew:patch:${id}`;
    await set(verification.patchedHtmlKey, { html: patched.html, edits: merged.filter((m) => m.status === "approved").map((m) => m.edit) });
  }

  // ---- Record ----
  const evidenceFor = (it) => it.issueIds.map((x) => issueById[x]?.title).filter(Boolean).join("; ");
  for (const it of items) {
    if (it.status !== "approved") continue;
    it.ledger = { type: it.type, title: it.title.slice(0, 140), detail: `${it.content}\n\nWhy: ${it.rationale}\nFixes: ${evidenceFor(it)}${it.needsInput?.length ? `\nNeeds from owner: ${it.needsInput.join("; ")}` : ""}${it.measuredDelta != null ? `\nMeasured: website audit ${it.measuredDelta >= 0 ? "+" : ""}${it.measuredDelta} points on its own` : ""}` };
    if (dispatch && clientId) { try { const a = await createAction(clientId, it.ledger); it.ledgerActionId = a.id; it.ledgerStatus = a.status; } catch (e) { it.ledgerError = e.message; } }
  }

  const run = {
    id, createdAt: new Date().toISOString(), goal, business: facts.name, place: proposal.place, clientId, dispatched: Boolean(dispatch && clientId),
    plan, handoffs, items: items.map(({ edit, ...rest }) => ({ ...rest, edit: edit ? { op: edit.op } : undefined })),
    verification, usage: { tokens: budget.used, budget: budget.tokens },
    summary: {
      issues: issues.length, drafted: items.length,
      approved: items.filter((i) => i.status === "approved").length, held: items.filter((i) => i.status === "held").length,
      rejected: items.filter((i) => i.status === "rejected").length, superseded: items.filter((i) => i.status === "superseded").length, handedOff: handoffs.length,
    },
    trace,
  };
  await set(`crew:run:${id}`, run);
  const index = (await get("crew:runs")) || [];
  await set("crew:runs", [{ id, at: run.createdAt, business: run.business, goal, summary: run.summary, delta: verification?.delta ?? null }, ...index].slice(0, 200));
  return run;
}

export const getCrewRun = (id) => get(`crew:run:${id}`);
export const listCrewRuns = async () => (await get("crew:runs")) || [];
export const getCrewPatch = (id) => get(`crew:patch:${id}`);
