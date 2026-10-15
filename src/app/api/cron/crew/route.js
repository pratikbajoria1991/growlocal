import { NextResponse } from "next/server";
import crypto from "crypto";
import { startDueRuns } from "@/lib/crew/monthly";
import { llmConfigured } from "@/lib/crew/llm";
import { chainNext } from "@/lib/crew/chain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel Cron calls this daily with "Authorization: Bearer $CRON_SECRET".
// Fails closed: without CRON_SECRET nothing runs.
function authorised(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

export async function GET(req) {
  if (!authorised(req)) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  if (!llmConfigured()) return NextResponse.json({ error: "No AI provider configured for the crew.", started: [] }, { status: 503 });
  const started = await startDueRuns();
  for (const s of started) if (s.runId) chainNext(req, s.runId);
  return NextResponse.json({ at: new Date().toISOString(), started });
}
