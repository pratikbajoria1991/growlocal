// Signed-cookie session. HttpOnly, SameSite=Lax, Secure in production.

import crypto from "crypto";
import { cookies } from "next/headers";
import { getUserById } from "./user-store";

const COOKIE = "growlocal_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

// Fails closed: a missing or short secret in production means every session
// signature is forgeable, so we refuse to sign or verify rather than fall
// back to a string anyone reading this file also knows.
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return s || "dev-only-session-secret-change-me";
  throw new Error("SESSION_SECRET must be set to 32+ random characters in production.");
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token) {
  const [body, sig] = (token || "").split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export async function setSession(userId) {
  const store = await cookies();
  store.set(COOKIE, sign({ uid: userId, exp: Date.now() + MAX_AGE_S * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentUser() {
  try {
    const store = await cookies();
    const payload = verify(store.get(COOKIE)?.value);
    if (!payload) return null;
    // Awaited inside the try so a store failure falls back to "signed out"
    // rather than an unhandled rejection escaping this function.
    return await getUserById(payload.uid);
  } catch { return null; }
}
