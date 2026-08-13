import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  let a, b;
  try { ({ a, b } = await req.json()); } catch {
    return NextResponse.json({ error: "Send a JSON body with two URLs." }, { status: 400 });
  }
  if (!a || !b) return NextResponse.json({ error: "Provide both URLs." }, { status: 400 });

  // Run both in parallel — a sequential compare feels twice as slow for no reason.
  const [ra, rb] = await Promise.allSettled([runAudit(a), runAudit(b)]);

  if (ra.status === "rejected" && rb.status === "rejected") {
    return NextResponse.json(
      { error: `Neither site could be fetched. ${ra.reason?.message || ""}` },
      { status: 502 }
    );
  }
  if (ra.status === "rejected") {
    return NextResponse.json({ error: `Couldn't fetch the first site: ${ra.reason?.message}` }, { status: 502 });
  }
  if (rb.status === "rejected") {
    return NextResponse.json({ error: `Couldn't fetch the second site: ${rb.reason?.message}` }, { status: 502 });
  }

  const you = ra.value;
  const them = rb.value;

  // Where does each side win, and by how much?
  const deltas = ["SEO", "AEO", "GEO"].map((cat) => ({
    category: cat,
    you: you.scores[cat].score,
    them: them.scores[cat].score,
    delta: you.scores[cat].score - them.scores[cat].score,
  }));

  // Checks they pass that you don't — the actionable gap.
  const gaps = [];
  for (const cat of ["SEO", "AEO", "GEO"]) {
    const theirPass = new Set(them.scores[cat].checks.filter((c) => c.pass).map((c) => c.id));
    for (const c of you.scores[cat].checks) {
      if (!c.pass && theirPass.has(c.id)) {
        gaps.push({ category: cat, label: c.label, fix: c.fix, recoverable: c.max - c.points });
      }
    }
  }
  gaps.sort((x, y) => y.recoverable - x.recoverable);

  return NextResponse.json({
    you: { url: you.url, overall: you.overall, grade: you.grade, scores: deltas.map((d) => ({ category: d.category, score: d.you })) },
    them: { url: them.url, overall: them.overall, grade: them.grade, scores: deltas.map((d) => ({ category: d.category, score: d.them })) },
    deltas,
    overallDelta: you.overall - them.overall,
    gaps: gaps.slice(0, 10),
    comparedAt: new Date().toISOString(),
  });
}
