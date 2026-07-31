// Encrypted OAuth refresh-token store (AES-256-GCM) + signed OAuth state.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const TOKEN_DIR = path.join(process.cwd(), ".data", "oauth-tokens");

function key() {
  const raw = process.env.OAUTH_TOKEN_ENCRYPTION_KEY || "dev-only-change-in-production";
  return crypto.createHash("sha256").update(raw).digest();
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

export function saveToken(userId, payload) {
  fs.mkdirSync(TOKEN_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(TOKEN_DIR, `${userId}.json`),
    JSON.stringify({ userId, stored_at: new Date().toISOString(), encrypted: encrypt(JSON.stringify(payload)) }, null, 2)
  );
}

export function readToken(userId) {
  const f = path.join(TOKEN_DIR, `${userId}.json`);
  if (!fs.existsSync(f)) return null;
  try {
    const rec = JSON.parse(fs.readFileSync(f, "utf8"));
    return JSON.parse(decrypt(rec.encrypted));
  } catch { return null; }
}

export function deleteToken(userId) {
  const f = path.join(TOKEN_DIR, `${userId}.json`);
  if (fs.existsSync(f)) { fs.unlinkSync(f); return true; }
  return false;
}

function stateSecret() {
  return process.env.OAUTH_STATE_SECRET || "dev-only-state-secret";
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
