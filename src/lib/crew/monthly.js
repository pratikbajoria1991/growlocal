// Monthly crew cycle for subscribed clients.
//
// Every active client with a goal gets one crew run per cycle (28 days).
// A daily cron calls startDueRuns(); each run is the normal staged crew job,
// dispatched to the client's ledger, so approved work appears in the owner's
// dashboard and risky changes wait for their OK. monthlyReport() compares the
// latest finished run with the one before it: measured, not estimated.

import { listClients, getClient } from "../clients";
import { get, set } from "../store";
import { startCrew, getCrewRun } from "./crew";

const CYCLE_DAYS = () => Number(process.env.CREW_CYCLE_DAYS) || 28;
const MAX_PER_DAY = () => Number(process.env.CREW_MAX_RUNS_PER_DAY) || 10;
const historyKey = (clientId) => `crew:client:${clientId}:runs`;

export const clientRuns = async (clientId) => (await get(historyKey(clientId))) || [];

// A client is in the monthly programme when it is active (paid) and has a goal.
const eligible = (c) => c && c.status === "active" && (c.crewGoal || "").trim().length >= 5 && (c.gbpLink || c.name);

export async function dueClients(now = Date.now()) {
  const out = [];
  for (const c of await listClients()) {
    if (!eligible(c)) continue;
    const last = (await clientRuns(c.id))[0];
    if (!last || now - Date.parse(last.startedAt) >= CYCLE_DAYS() * 86_400_000) out.push(c);
  }
  return out;
}

const ownerFactsOf = (c) =>
  [c.ownerFacts, c.services && `Services: ${c.services}`, c.phone && `Phone: ${c.phone}`].filter(Boolean).join("\n").slice(0, 4000);

/** Starts this cycle's run for one client and records it in their history. */
export async function startClientRun(clientOrId) {
  const c = typeof clientOrId === "string" ? await getClient(clientOrId) : clientOrId;
  if (!eligible(c)) throw Object.assign(new Error("Client isn't active or has no goal set."), { code: "not_eligible" });
  const job = await startCrew({
    input: c.gbpLink || [c.name, c.city].filter(Boolean).join(", "),
    website: c.website || "",
    goal: c.crewGoal,
    ownerFacts: ownerFactsOf(c),
    clientId: c.id,
    dispatch: true,
  });
  const history = await clientRuns(c.id);
  await set(historyKey(c.id), [{ runId: job.id, startedAt: job.createdAt, goal: c.crewGoal }, ...history].slice(0, 36));
  return job;
}

/** Starts runs for every due client (capped per day). Returns the job ids started. */
export async function startDueRuns() {
  const due = (await dueClients()).slice(0, MAX_PER_DAY());
  const started = [];
  for (const c of due) {
    try {
      const job = await startClientRun(c);
      started.push({ clientId: c.id, runId: job.id });
    } catch (e) {
      started.push({ clientId: c.id, error: e.message });
    }
  }
  return started;
}

const pick = (run) => run && {
  runId: run.id, at: run.createdAt, status: run.status,
  rating: run.place?.rating ?? null, reviews: run.place?.reviews ?? null,
  audit: run.verification?.before || null, auditIfApplied: run.verification?.after || null,
  approved: run.summary?.approved ?? 0, waitingForOwner: run.summary?.needsInput ?? 0,
  ownerQuestions: run.summary?.ownerQuestions || [],
};

/**
 * This cycle vs the previous one, from measured values only. The baseline for
 * "this cycle" is the start of the run (what was live), so progress means
 * changes that actually reached Google or the website in between.
 */
export async function monthlyReport(clientId) {
  const history = await clientRuns(clientId);
  const runs = [];
  for (const h of history) {
    const r = await getCrewRun(h.runId);
    if (r && r.status === "done") runs.push(r);
    if (runs.length === 2) break;
  }
  const [cur, prev] = runs.map(pick);
  if (!cur) return { clientId, ready: false, note: "No finished run yet." };
  const delta = (a, b) => (a != null && b != null ? Math.round((a - b) * 10) / 10 : null);
  return {
    clientId, ready: true, current: cur, previous: prev || null,
    change: prev ? {
      rating: delta(cur.rating, prev.rating),
      reviews: delta(cur.reviews, prev.reviews),
      auditOverall: delta(cur.audit?.overall, prev.audit?.overall),
      seo: delta(cur.audit?.SEO, prev.audit?.SEO), aeo: delta(cur.audit?.AEO, prev.audit?.AEO), geo: delta(cur.audit?.GEO, prev.audit?.GEO),
    } : null,
  };
}

export { tidyQuestions } from "./questions";
