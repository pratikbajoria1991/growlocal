import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, getClient, saveDraft } from "@/lib/clients";
import { runAgent, AGENT_ACTIONS } from "@/lib/agent";
import { runAudit } from "@/lib/audit";
import { runGbpAudit } from "@/lib/gbp-audit";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  // Admin-only, but each run can hit a paid API — cap it so a stuck loop
  // can't quietly spend money.
  const blocked = await rateLimited(req, "concierge", { limit: 40, windowSeconds: 600 });
  if (blocked) return blocked;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { clientId, action, input } = body || {};
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });

  try {
    // Website audit — the diagnostic half of the service.
    if (action === "audit") {
      if (!client.website) return NextResponse.json({ error: "This client has no website on file." }, { status: 400 });
      const r = await runAudit(client.website);
      const summary = `# Visibility audit — ${client.name}\n\n**${r.url}**\n\nOverall **${r.overall}/100** (grade ${r.grade}) — SEO ${r.scores.SEO.score}, AEO ${r.scores.AEO.score}, GEO ${r.scores.GEO.score}\n\n${r.rendering?.clientRendered ? `> ⚠️ ${r.rendering.note}\n\n` : ""}## Top fixes\n\n${r.priorities.map((p, i) => `${i + 1}. **${p.label}** (+${p.recoverable} pts, ${p.category})\n   ${p.fix}`).join("\n\n")}`;
      const draft = await saveDraft(clientId, { action, label: "Website audit", output: summary, source: r.source, meta: { overall: r.overall, grade: r.grade } });
      return NextResponse.json({ draft, raw: r });
    }

    // GBP profile audit — needs a Maps link and a Places key.
    if (action === "gbp") {
      if (!client.gbpLink) return NextResponse.json({ error: "This client has no Google Maps link on file." }, { status: 400 });
      const r = await runGbpAudit(client.gbpLink);
      const summary = `# Google Business Profile audit — ${r.place.name}\n\n${r.place.address || ""}\n\nScore **${r.overall}/100** (grade ${r.grade})\n\n## What's costing them\n\n${(r.whatYoureLosing || []).map((c) => `- **${c.label}** — ${c.losing}`).join("\n") || "_Nothing flagged._"}\n\n## Top fixes\n\n${r.priorities.map((p, i) => `${i + 1}. **${p.label}** (+${p.recoverable} pts)\n   ${p.fix}`).join("\n\n")}`;
      const draft = await saveDraft(clientId, { action, label: "GBP profile audit", output: summary, source: "gbp", meta: { overall: r.overall, grade: r.grade } });
      return NextResponse.json({ draft, raw: r });
    }

    // Content actions — posts, review replies, FAQ, report.
    if (!AGENT_ACTIONS[action]) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

    const { output, source, ms } = await runAgent(action, client, input || "");
    const draft = await saveDraft(clientId, {
      action,
      label: AGENT_ACTIONS[action].label,
      output,
      source,
      input: (input || "").trim() || null,
      meta: { ms, words: output.trim().split(/\s+/).length },
    });
    return NextResponse.json({ draft });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Run failed.", code: e.code || null }, { status: 502 });
  }
}
