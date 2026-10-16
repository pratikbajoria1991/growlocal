// Concierge client book.
//
// Growlocal is a managed service: we do the work, the owner doesn't. Until
// Google approves our API access, delivery runs through Manager access on the
// client's profile and this console. This stores who we're servicing so the
// same context feeds every action, instead of being retyped each time.

import { get, set } from "./store";

const INDEX_KEY = "concierge:clients";
const clientKey = (id) => `concierge:client:${id}`;
const draftsKey = (id) => `concierge:drafts:${id}`;

// Admin surface — internal only, never public. Fails closed: no ADMIN_EMAILS
// configured means nobody gets in, including in development.
export function isAdmin(user) {
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.length || !user?.email) return false;
  return allow.includes(user.email.toLowerCase());
}

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

export async function listClients() {
  const ids = (await get(INDEX_KEY)) || [];
  const clients = await Promise.all(ids.map((id) => get(clientKey(id))));
  return clients.filter(Boolean).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export async function getClient(id) {
  if (!id) return null;
  return (await get(clientKey(id))) || null;
}

// Businesses a signed-in owner is allowed to see. A chain owner can have
// several locations under one email.
export async function clientsForOwner(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return [];
  return (await listClients()).filter((c) => c.ownerEmail && c.ownerEmail === e);
}

export async function upsertClient(patch) {
  const now = new Date().toISOString();
  const id = patch.id || `${slug(patch.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const existing = (await get(clientKey(id))) || {};

  const client = {
    id,
    name: (patch.name ?? existing.name ?? "").trim(),
    vertical: (patch.vertical ?? existing.vertical ?? "").trim(),
    city: (patch.city ?? existing.city ?? "").trim(),
    website: (patch.website ?? existing.website ?? "").trim(),
    gbpLink: (patch.gbpLink ?? existing.gbpLink ?? "").trim(),
    phone: (patch.phone ?? existing.phone ?? "").trim(),
    // The owner's sign-in email. Links this client to their dashboard, where
    // they see the work log and approve risky changes. Lowercased so a
    // capitalised magic-link address still matches.
    ownerEmail: (patch.ownerEmail ?? existing.ownerEmail ?? "").trim().toLowerCase(),
    services: (patch.services ?? existing.services ?? "").trim(),
    notes: (patch.notes ?? existing.notes ?? "").trim(),
    // Monthly Growth Crew: the goal it works toward, and verified facts from
    // the owner (hours, doctors, services) that let drafts ship complete.
    crewGoal: (patch.crewGoal ?? existing.crewGoal ?? "").trim().slice(0, 500),
    ownerFacts: (patch.ownerFacts ?? existing.ownerFacts ?? "").trim().slice(0, 4000),
    // Answers the owner gave to the crew's questions, so answered questions
    // aren't asked again. The text also goes into ownerFacts for the crew.
    ownerAnswers: Array.isArray(patch.ownerAnswers) ? patch.ownerAnswers.slice(-60) : existing.ownerAnswers || [],
    // Owner onboarding form (src/lib/onboarding.js) and the owner's consent
    // to let Growlocal act on their behalf, with who gave it and when.
    onboarding: patch.onboarding ?? existing.onboarding ?? null,
    consent: patch.consent ?? existing.consent ?? null,
    status: patch.status ?? existing.status ?? "trial",
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };

  await set(clientKey(id), client);

  const ids = (await get(INDEX_KEY)) || [];
  if (!ids.includes(id)) await set(INDEX_KEY, [...ids, id]);

  return client;
}

export async function removeClient(id) {
  const ids = (await get(INDEX_KEY)) || [];
  await set(INDEX_KEY, ids.filter((x) => x !== id));
  await set(clientKey(id), null);
  await set(draftsKey(id), null);
  await set(`ledger:${id}`, null);
  return true;
}

// Drafts are kept so a week's work is reviewable later — and so we can see
// what we actually shipped a client when they ask.
export async function listDrafts(clientId) {
  return (await get(draftsKey(clientId))) || [];
}

export async function saveDraft(clientId, draft) {
  const all = await listDrafts(clientId);
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    ...draft,
  };
  await set(draftsKey(clientId), [entry, ...all].slice(0, 100));
  return entry;
}

export async function deleteDraft(clientId, draftId) {
  const all = await listDrafts(clientId);
  await set(draftsKey(clientId), all.filter((d) => d.id !== draftId));
  return true;
}
