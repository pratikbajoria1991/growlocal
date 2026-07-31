import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { runAgent, AGENT_ACTIONS } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.gbp?.connected) return NextResponse.json({ error: "Connect your Google Business Profile first." }, { status: 400 });

  let action;
  try { ({ action } = await req.json()); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!AGENT_ACTIONS[action]) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  try {
    const { output, source, ms } = await runAgent(action, user);
    return NextResponse.json({
      ok: true,
      action,
      label: AGENT_ACTIONS[action].label,
      source,
      ms,
      words: output.trim().split(/\s+/).length,
      output,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Generation failed." }, { status: 502 });
  }
}
