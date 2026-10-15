import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, upsertClient } from "@/lib/clients";
import { runAudit } from "@/lib/audit";
import { opportunityScore, listProspects, saveProspect, removeProspect, clearProspects } from "@/lib/prospects";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function gate() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Not authorised." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const { error } = await gate();
  if (error) return error;
  return NextResponse.json({ prospects: await listProspects() });
}

// One URL per request. Scanning 30 sites in a single call would blow the
// function timeout; the client loops and shows progress instead.
export async function POST(req) {
  const { error } = await gate();
  if (error) return error;

  const blocked = await rateLimited(req, "prospect-scan", { limit: 120, windowSeconds: 600 });
  if (blocked) return blocked;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  // Promote an existing prospect into the client book.
  if (body.promote) {
    const client = await upsertClient({
      name: body.name || body.url,
      website: body.url,
      notes: `From prospecting scan — visibility ${body.overall}/100 (SEO ${body.seo} / AEO ${body.aeo} / GEO ${body.geo}).`,
    });
    return NextResponse.json({ client });
  }

  const { url, name } = body || {};
  if (!url || typeof url !== "string") return NextResponse.json({ error: "Provide a URL." }, { status: 400 });

  try {
    const r = await runAudit(url);
    const seo = r.scores.SEO.score, aeo = r.scores.AEO.score, geo = r.scores.GEO.score;

    const prospect = {
      url: r.url,
      name: (name || "").trim() || null,
      at: new Date().toISOString(),
      overall: r.overall,
      grade: r.grade,
      seo, aeo, geo,
      opportunity: opportunityScore({ seo, aeo, geo }),
      clientRendered: Boolean(r.rendering?.clientRendered),
      topGaps: r.priorities.slice(0, 3).map((p) => ({
        label: p.label, fix: p.fix, recoverable: p.recoverable, category: p.category,
      })),
    };

    await saveProspect(prospect);
    return NextResponse.json({ prospect });
  } catch (e) {
    // A failed fetch is a real outcome worth recording, not a crash.
    return NextResponse.json({ error: e.message || "Scan failed.", url }, { status: 200 });
  }
}

export async function DELETE(req) {
  const { error } = await gate();
  if (error) return error;

  const url = new URL(req.url).searchParams.get("url");
  if (url === "__all__") { await clearProspects(); return NextResponse.json({ ok: true }); }
  if (!url) return NextResponse.json({ error: "Which prospect?" }, { status: 400 });

  await removeProspect(url);
  return NextResponse.json({ ok: true });
}
