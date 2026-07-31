// Signed-cookie session. HttpOnly, SameSite=Lax, Secure in production.

import crypto from "crypto";
import { cookies } from "next/headers";
import { getUserById } from "./user-store";

const COOKIE = "growlocal_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

function secret() {
  return process.env.SESSION_SECRET || "dev-only-session-secret-change-me";
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
    return getUserById(payload.uid);
  } catch { return null; }
}
