// Action ledger — the record of every change we make for a business.
//
// This is the service's backbone and, long term, its moat. Each entry answers
// three questions an owner (and our own learning) needs answered:
//   1. What did we change, where, and when?        (Execute)
//   2. Did the owner need to OK it, and did they?  (Trust)
//   3. What happened to the numbers afterwards?    (Verify)
//
// Metrics are entered from the owner's real Google Business Profile
// Performance screen (we have Manager access). Nothing here is estimated or
// modelled — a missing number stays missing rather than being filled in.

import { get, set } from "./store";
import { ACTION_TYPES, CHECKPOINTS, METRICS } from "./ledger-types";

export * from "./ledger-types";

const key = (clientId) => `ledger:${clientId}`;
const MAX_ENTRIES = 500;

function cleanMetrics(input) {
  if (!input || typeof input !== "object") return null;
  const out = {};
  for (const [k] of METRICS) {
    const v = input[k];
    if (v === "" || v == null) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) out[k] = Math.round(n);
  }
  if (!Object.keys(out).length) return null;
  // The period matters: 28 days before vs 28 days after is comparable; a
  // 7-day baseline against a 28-day follow-up is not.
  out.periodDays = Number(input.periodDays) > 0 ? Math.round(Number(input.periodDays)) : 28;
  return out;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const clip = (s, n) => String(s || "").trim().slice(0, n);

export async function listActions(clientId) {
  if (!clientId) return [];
  return (await get(key(clientId))) || [];
}

async function save(clientId, all) {
  await set(key(clientId), all.slice(0, MAX_ENTRIES));
}

export async function createAction(clientId, input) {
  const type = ACTION_TYPES[input.type] ? input.type : "other";
  const def = ACTION_TYPES[type];
  const now = new Date().toISOString();

  const entry = {
    id: newId(),
    clientId,
    type,
    surface: def.surface,
    risk: def.risk,
    title: clip(input.title, 140) || def.label,
    detail: clip(input.detail, 4000),
    plannedFor: clip(input.plannedFor, 10) || now.slice(0, 10),
    // Risky work is born waiting for the owner; everything else is simply planned.
    status: def.risk === "approval" ? "awaiting_approval" : "planned",
    approval: null,
    doneAt: null,
    proofUrl: null,
    baseline: null,
    followups: [],
    createdAt: now,
    updatedAt: now,
  };

  const all = await listActions(clientId);
  await save(clientId, [entry, ...all]);
  return entry;
}

// Operator updates. Owners never reach this — see decideAction.
export async function updateAction(clientId, actionId, patch) {
  const all = await listActions(clientId);
  const i = all.findIndex((a) => a.id === actionId);
  if (i === -1) return null;
  const a = { ...all[i] };
  const now = new Date().toISOString();

  if (patch.title != null) a.title = clip(patch.title, 140) || a.title;
  if (patch.detail != null) a.detail = clip(patch.detail, 4000);
  if (patch.plannedFor != null) a.plannedFor = clip(patch.plannedFor, 10) || a.plannedFor;
  if (patch.proofUrl != null) a.proofUrl = clip(patch.proofUrl, 500) || null;
  if (patch.baseline !== undefined) a.baseline = cleanMetrics(patch.baseline);

  if (patch.status === "done") {
    // The guardrail lives in the data layer, not just the UI: approval-tier
    // work cannot be marked shipped unless the owner said yes.
    if (a.risk === "approval" && a.approval?.decision !== "approved") {
      throw new Error("This change needs the owner's approval before it can be marked done.");
    }
    a.status = "done";
    a.doneAt = a.doneAt || now;
  }

  if (patch.followup) {
    if (a.status !== "done") throw new Error("Record results only after the change has shipped.");
    const day = Number(patch.followup.day);
    const metrics = cleanMetrics(patch.followup.metrics);
    if (!CHECKPOINTS.includes(day)) throw new Error(`Follow-ups are taken at day ${CHECKPOINTS.join(", ")}.`);
    if (!metrics) throw new Error("Enter at least one number from the Performance screen.");
    a.followups = [...(a.followups || []).filter((f) => f.day !== day), { day, metrics, at: now }]
      .sort((x, y) => x.day - y.day);
  }

  a.updatedAt = now;
  all[i] = a;
  await save(clientId, all);
  return a;
}

// Yes or no on work that needs the owner's OK. `by` records who decided —
// the owner themselves, or an operator transcribing a WhatsApp reply.
export async function decideAction(clientId, actionId, { decision, note, by }) {
  if (!["approved", "declined"].includes(decision)) throw new Error("Decision must be approved or declined.");
  const all = await listActions(clientId);
  const i = all.findIndex((a) => a.id === actionId);
  if (i === -1) return null;
  const a = { ...all[i] };
  if (a.status !== "awaiting_approval") throw new Error("This change isn't waiting for a decision.");

  const now = new Date().toISOString();
  a.approval = { decision, note: clip(note, 500) || null, by: by || null, at: now };
  a.status = decision;
  a.updatedAt = now;
  all[i] = a;
  await save(clientId, all);
  return a;
}

export async function deleteAction(clientId, actionId) {
  const all = await listActions(clientId);
  await save(clientId, all.filter((a) => a.id !== actionId));
  return true;
}
