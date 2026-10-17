import { NextResponse } from "next/server";
import crypto from "crypto";
import { dueForTracking, runTracking } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// A few clients per call so each run stays well inside the time limit; the
// daily schedule works through the rest over the week.
const PER_RUN = Number(process.env.TRACK_PER_RUN || 3);

function authorised(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

export async function GET(req) {
  if (!authorised(req)) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  const due = (await dueForTracking()).slice(0, PER_RUN);
  const done = [];
  for (const c of due) {
    try {
      const s = await runTracking(c);
      done.push({ clientId: c.id, at: s.at });
    } catch (e) {
      done.push({ clientId: c.id, error: e.message });
    }
  }
  return NextResponse.json({ at: new Date().toISOString(), done });
}
