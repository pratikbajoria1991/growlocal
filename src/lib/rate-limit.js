// Per-IP rate limiting for the anonymous, cost-bearing endpoints — audit
// fetches, the reader-proxy fallback, and (once configured) paid Places/
// Gemini API calls all sit behind routes anyone on the internet can hit with
// no login. Backed by the same Upstash Redis already wired for the app's
// persistent store.
//
// Fails OPEN: if Redis isn't configured or errors, requests are allowed
// through rather than blocked. This is an abuse brake, not an auth gate —
// availability for real users matters more than a hard cap holding under
// infra trouble.

import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    : null;

const limiters = new Map();

function limiterFor(name, limit, windowSeconds) {
  if (!redis) return null;
  if (!limiters.has(name)) {
    limiters.set(
      name,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        prefix: `ratelimit:${name}`,
        analytics: false,
      })
    );
  }
  return limiters.get(name);
}

export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Checks and consumes one request against a named bucket's per-IP quota.
 * Returns a 429 NextResponse when the caller should stop, or null to proceed.
 *
 *   const blocked = await rateLimited(req, "audit", { limit: 10, windowSeconds: 600 });
 *   if (blocked) return blocked;
 *
 * Pass `global: true` for a site-wide cap shared by every visitor (a daily
 * ceiling on a paid API), on top of the per-IP bucket.
 */
export async function rateLimited(req, name, { limit, windowSeconds, global = false }) {
  const limiter = limiterFor(name, limit, windowSeconds);
  if (!limiter) return null;

  try {
    const who = global ? "all" : clientIp(req);
    const { success, reset } = await limiter.limit(`${name}:${who}`);
    if (success) return null;

    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: `Too many requests — try again in ${retryAfter}s.`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  } catch {
    return null;
  }
}
