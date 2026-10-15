import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { hasApiToken } from "@/lib/api-token";
import { runCrew, getCrewRun, listCrewRuns, getCrewPatch } from "@/lib/crew/crew";
import { llmConfigured } from "@/lib/crew/llm";
import { mockLlm } from "@/lib/crew/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // a full crew run is several model turns

async function gate(req) {
  if (hasApiToken(req)) return null;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  return null;
}

// GET            -> list runs
// GET ?id=…      -> one run
// GET ?id=…&patch=1 -> the patched HTML + applied edits for that run
export async function GET(req) {
  const denied = await gate(req); if (denied) return denied;
  const q = new URL(req.url).searchParams, id = q.get("id");
  if (!id) return NextResponse.json({ runs: await listCrewRuns(), llmConfigured: llmConfigured() });
  if (q.get("patch")) { const p = await getCrewPatch(id); return p ? NextResponse.json(p) : NextResponse.json({ error: "No patch for that run." }, { status: 404 }); }
  const run = await getCrewRun(id);
  return run ? NextResponse.json(run) : NextResponse.json({ error: "Run not found." }, { status: 404 });
}

// POST { input, goal, website?, ownerFacts?, clientId?, dispatch? }
export async function POST(req) {
  const denied = await gate(req); if (denied) return denied;
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const input = String(b?.input || "").trim(), goal = String(b?.goal || "").trim();
  if (input.length < 3 || goal.length < 5) return NextResponse.json({ error: "Send 'input' (Maps link or business name) and 'goal'." }, { status: 400 });

  // Scripted model for plumbing tests only — never in production.
  const useMock = b.mock === true && process.env.NODE_ENV !== "production";
  if (!useMock && !llmConfigured()) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set on the server.", code: "not_configured" }, { status: 501 });

  try {
    const run = await runCrew({
      input: input.slice(0, 500), website: String(b.website || "").slice(0, 300), goal: goal.slice(0, 500),
      ownerFacts: String(b.ownerFacts || "").slice(0, 4000), clientId: b.clientId ? String(b.clientId).slice(0, 80) : null,
      dispatch: b.dispatch === true, llm: useMock ? mockLlm() : null,
    });
    return NextResponse.json(run);
  } catch (e) {
    console.error("[crew]", e.code || "", e.message);
    return NextResponse.json({ error: e.message || "Crew run failed.", code: e.code || null }, { status: e.code === "budget" ? 429 : 502 });
  }
}
