import { NextResponse } from "next/server";
import { findBacklinks, FetchBlockedError } from "@/lib/backlinks";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req) {
  const blocked = await rateLimited(req, "backlinks", { limit: 10, windowSeconds: 600 });
  if (blocked) return blocked;

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Send a JSON body with a url field." }, { status: 400 });
  }
  const url = String(body?.url || "").trim();
  const competitor = String(body?.competitor || "").trim();
  if (!url || url.length > 2048 || competitor.length > 2048) {
    return NextResponse.json({ error: "Enter your website address." }, { status: 400 });
  }
  try {
    const result = await findBacklinks({
      url,
      competitor: competitor || undefined,
      name: String(body?.name || "").slice(0, 80),
      category: String(body?.category || "other").slice(0, 20),
    });
    return NextResponse.json(result);
  } catch (e) {
    const status = e instanceof FetchBlockedError ? 400 : 502;
    if (status === 502) console.error("[backlinks]", e.message);
    return NextResponse.json({ error: status === 400 ? e.message : "The check failed. Try again shortly." }, { status });
  }
}
