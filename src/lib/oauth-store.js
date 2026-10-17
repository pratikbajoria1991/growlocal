// Encrypted OAuth refresh-token store (AES-256-GCM) + signed OAuth state.
// Tokens are stored in the same KV store as everything else — see lib/store.js
// for why the old .data/oauth-tokens/*.json filesystem store didn't survive
// Vercel's serverless environment. Encryption is unchanged; only the at-rest
// location moved.

import crypto from "crypto";
import { get, set, del } from "./store";

const tokenKey = (userId) => `oauth:token:${userId}`;

// Fails closed in production — a missing or short secret here is worse than
// refusing to run: it's the key that protects every stored Google OAuth
// refresh token, or the signature that stops a forged OAuth state.
function requireSecret(name, fallback) {
  const v = process.env[name];
  if (v && v.length >= 32) return v;
  if (process.env.NODE_ENV !== "production") return v || fallback;
  throw new Error(`${name} must be set to 32+ random characters in production.`);
}

function key() {
  return crypto.createHash("sha256").update(requireSecret("OAUTH_TOKEN_ENCRYPTION_KEY", "dev-only-change-in-production")).digest();
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return { iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: data.toString("base64") };
}

function decrypt({ iv, tag, data }) {
  const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
}

// Same AES-256-GCM sealing for other stored credentials (e.g. WordPress
// application passwords).
export const sealJson = (obj) => encrypt(JSON.stringify(obj));
export const openJson = (sealed) => JSON.parse(decrypt(sealed));

export async function saveToken(userId, payload) {
  await set(tokenKey(userId), { userId, stored_at: new Date().toISOString(), encrypted: encrypt(JSON.stringify(payload)) });
}

export async function readToken(userId) {
  const rec = await get(tokenKey(userId));
  if (!rec) return null;
  try { return JSON.parse(decrypt(rec.encrypted)); } catch { return null; }
}

export async function deleteToken(userId) {
  return del(tokenKey(userId));
}

function stateSecret() {
  return requireSecret("OAUTH_STATE_SECRET", "dev-only-state-secret");
}

export function signState(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state) {
  const [body, sig] = (state || "").split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  if (sig !== expected) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { return null; }
}
