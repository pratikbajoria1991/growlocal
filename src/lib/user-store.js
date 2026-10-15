// User store — backed by the same KV store as everything else (Upstash Redis
// on Vercel, filesystem in local dev; see lib/store.js).
//
// This used to write directly to .data/users/*.json. That's fine on a laptop
// but silently loses every signup on Vercel: the filesystem there is
// ephemeral per-invocation and not shared across instances, so a user who
// verified their magic link could vanish on the next deploy or even the next
// cold start. Moving it here means signups actually survive.

import crypto from "crypto";
import { get, set } from "./store";

const userKey = (id) => `user:${id}`;

export function emailToUserId(email) {
  return crypto.createHash("sha1").update(email.toLowerCase().trim()).digest("hex").slice(0, 16);
}

export async function getUserById(userId) {
  if (!userId) return null;
  return (await get(userKey(userId))) || null;
}

export async function findUserByEmail(email) {
  return getUserById(emailToUserId(email));
}

export async function upsertUser(email, patch = {}) {
  const id = emailToUserId(email);
  const existing = await getUserById(id);
  const now = new Date().toISOString();
  const record = existing
    ? { ...existing, ...patch, updated_at: now }
    : {
        id,
        email: email.toLowerCase().trim(),
        created_at: now,
        updated_at: now,
        verified_at: null,
        plan: null,
        gbp: { connected: false, granted_at: null, business_name: null },
        magic_link: null,
        ...patch,
      };
  await set(userKey(id), record);
  return record;
}

export async function issueMagicLink(email) {
  const user = await upsertUser(email);
  const token = crypto.randomBytes(24).toString("base64url");
  const expires = Date.now() + 30 * 60 * 1000;
  await upsertUser(email, { magic_link: { token, expires } });
  return { token, userId: user.id, expires };
}

export async function consumeMagicLink(email, token) {
  const user = await findUserByEmail(email);
  if (!user?.magic_link) return null;
  if (user.magic_link.token !== token) return null;
  if (user.magic_link.expires < Date.now()) return null;
  return upsertUser(email, {
    magic_link: null,
    verified_at: user.verified_at || new Date().toISOString(),
  });
}

export async function setPlan(userId, plan) {
  const user = await getUserById(userId);
  if (!user) return null;
  return upsertUser(user.email, {
    plan: { ...plan, started_at: new Date().toISOString(), active: true },
  });
}

export async function setGbpConnected(userId, businessName = null) {
  const user = await getUserById(userId);
  if (!user) return null;
  return upsertUser(user.email, {
    gbp: { connected: true, granted_at: new Date().toISOString(), business_name: businessName },
  });
}
