// Done-for-you directory listings: storage, status changes and a live check.
//
// Submission is manual — none of these directories has a public submission
// API — so this tracks the team's work, keeps every listing on the same
// details (the "submission kit"), and checks live listings for those details.

import { get, set } from "./store";
import { safeFetch } from "./safe-fetch";
import { directoriesFor, citationProgress, CITATION_STATUSES } from "./directories";
import { createAction, updateAction } from "./ledger";

const key = (clientId) => `concierge:citations:${clientId}`;
const STATUS_IDS = new Set(CITATION_STATUSES.map((s) => s.id));

export async function getCitations(client) {
  const directories = directoriesFor(client.vertical);
  const state = (await get(key(client.id))) || {};
  return { directories, state, progress: citationProgress(directories, state) };
}

/** Operator update. Going live records a done action in the owner's work log. */
export async function updateCitation(client, directoryId, { status, listingUrl, note, check }) {
  const directories = directoriesFor(client.vertical);
  const dir = directories.find((d) => d.id === directoryId);
  if (!dir) throw new Error("Unknown directory for this client.");
  const state = (await get(key(client.id))) || {};
  const prev = state[directoryId] || {};
  const next = {
    ...prev,
    status: STATUS_IDS.has(status) ? status : prev.status || "todo",
    listingUrl: listingUrl !== undefined ? String(listingUrl || "").trim().slice(0, 500) || null : prev.listingUrl || null,
    note: note !== undefined ? String(note || "").trim().slice(0, 300) || null : prev.note || null,
    ...(check ? { check } : {}),
    updatedAt: new Date().toISOString(),
  };
  if (next.status === "live" && prev.status !== "live" && !prev.actionId) {
    const a = await createAction(client.id, { type: "citation", title: `Listed on ${dir.name}`, detail: next.listingUrl ? `Live listing: ${next.listingUrl}` : "" });
    await updateAction(client.id, a.id, { status: "done", proofUrl: next.listingUrl || "" }).catch(() => {});
    next.actionId = a.id;
  }
  state[directoryId] = next;
  await set(key(client.id), state);
  return { state, progress: citationProgress(directories, state) };
}

const digits = (s) => String(s || "").replace(/\D/g, "");
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2);

/**
 * Fetches a live listing and looks for the business's name and phone.
 * Many directories block automated visits; then it says so instead of guessing.
 */
export async function checkListing(url, nap) {
  const at = new Date().toISOString();
  let page;
  try { page = await safeFetch(url, { timeoutMs: 9000 }); } catch (e) { return { at, ok: false, reason: `Couldn't open the listing (${e.message}).` }; }
  if (!page.ok) return { at, ok: false, reason: page.status ? `The listing returned HTTP ${page.status}; the site may block automated checks. Check it by hand.` : "Couldn't open the listing." };
  const text = String(page.body || "").replace(/<[^>]+>/g, " ").toLowerCase();
  const textDigits = digits(text);
  const phone = digits(nap.phone).slice(-10);
  const nameWords = words(nap.name);
  const nameHits = nameWords.filter((w) => text.includes(w)).length;
  const nameOk = nameWords.length ? nameHits / nameWords.length >= 0.6 : null;
  const phoneOk = phone.length >= 8 ? textDigits.includes(phone) : null;
  if (nameOk === false && phoneOk !== true) return { at, ok: false, nameOk, phoneOk, reason: "The page doesn't show the business name. It may be the wrong listing, or the site loads its content with scripts." };
  return { at, ok: nameOk !== false && phoneOk !== false, nameOk, phoneOk, reason: phoneOk === false ? "Name found, but the phone number on the listing doesn't match." : null };
}
