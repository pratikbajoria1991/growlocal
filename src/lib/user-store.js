// File-backed user store for MVP. Swap to Postgres/Supabase before scale.
// Data lives under .data/ at the project root (gitignored).

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), ".data");
const USER_DIR = path.join(DATA_DIR, "users");

function ensureDir() {
  if (!fs.existsSync(USER_DIR)) fs.mkdirSync(USER_DIR, { recursive: true });
}

export function emailToUserId(email) {
  return crypto.createHash("sha1").update(email.toLowerCase().trim()).digest("hex").slice(0, 16);
}

export function getUserById(userId) {
  ensureDir();
  const f = path.join(USER_DIR, `${userId}.json`);
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; }
}

export function findUserByEmail(email) {
  return getUserById(emailToUserId(email));
}

export function upsertUser(email, patch = {}) {
  ensureDir();
  const id = emailToUserId(email);
  const f = path.join(USER_DIR, `${id}.json`);
  const existing = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
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
  fs.writeFileSync(f, JSON.stringify(record, null, 2));
  return record;
}

export function issueMagicLink(email) {
  const user = upsertUser(email);
  const token = crypto.randomBytes(24).toString("base64url");
  const expires = Date.now() + 30 * 60 * 1000;
  upsertUser(email, { magic_link: { token, expires } });
  return { token, userId: user.id, expires };
}

export function consumeMagicLink(email, token) {
  const user = findUserByEmail(email);
  if (!user?.magic_link) return null;
  if (user.magic_link.token !== token) return null;
  if (user.magic_link.expires < Date.now()) return null;
  return upsertUser(email, {
    magic_link: null,
    verified_at: user.verified_at || new Date().toISOString(),
  });
}

export function setPlan(userId, plan) {
  const user = getUserById(userId);
  if (!user) return null;
  return upsertUser(user.email, {
    plan: { ...plan, started_at: new Date().toISOString(), active: true },
  });
}

export function setGbpConnected(userId, businessName = null) {
  const user = getUserById(userId);
  if (!user) return null;
  return upsertUser(user.email, {
    gbp: { connected: true, granted_at: new Date().toISOString(), business_name: businessName },
  });
}
