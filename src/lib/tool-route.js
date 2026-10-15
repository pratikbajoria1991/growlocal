// Shared POST handler for the free tools: per-IP rate limit, an optional
// site-wide daily cap for tools that spend paid API calls, JSON parsing,
// input validation and consistent error responses.

import { NextResponse } from "next/server";
import { rateLimited } from "./rate-limit.js";
import { FetchBlockedError } from "./safe-fetch.js";
import { PlacesError } from "./places.js";

const text = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * @param {object} o
 * @param {string} o.bucket  rate-limit name
 * @param {{limit:number, windowSeconds:number}} o.perIp
 * @param {number} [o.dailyCap]  site-wide calls per day
 * @param {(body:object, text:Function) => object|string} o.validate  returns input, or an error message
 * @param {(input:object) => Promise<object>} o.run
 */
export function toolHandler({ bucket, perIp, dailyCap, validate, run }) {
  return async function POST(req) {
    const blocked = await rateLimited(req, bucket, perIp);
    if (blocked) return blocked;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
    }
    const input = validate(body || {}, text);
    if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

    if (dailyCap) {
      const capped = await rateLimited(req, `${bucket}-daily`, { limit: dailyCap, windowSeconds: 86_400, global: true });
      if (capped) return NextResponse.json({ error: "This free tool has reached today's limit. Try again tomorrow.", code: "daily_cap" }, { status: 429 });
    }

    try {
      return NextResponse.json(await run(input));
    } catch (e) {
      if (e instanceof FetchBlockedError || e.userFacing) return NextResponse.json({ error: e.message }, { status: 422 });
      if (e instanceof PlacesError && e.code === "not_configured") {
        return NextResponse.json({ error: "This tool isn't switched on yet.", code: "not_configured" }, { status: 503 });
      }
      if (e.code === "not_configured") return NextResponse.json({ error: e.message, code: "not_configured" }, { status: 503 });
      console.error(`[${bucket}]`, e.message);
      return NextResponse.json({ error: "The check failed. Try again shortly." }, { status: 502 });
    }
  };
}
