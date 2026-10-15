import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { hasApiToken } from "@/lib/api-token";
import { startCrew, runCrew, getCrewRun, listCrewRuns, getCrewPatch, crewStats } from "@/lib/crew/crew";
import { llmConfigured, provider, MODEL } from "@/lib/crew/llm";
import { mockLlm } from "@/lib/crew/mock";
import { chainNext } from "@/lib/crew/chain";
import { startClientRun, monthlyReport, clientRuns } from "@/lib/crew/monthly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // one crew stage per request, each well under this

async function gate(req) {
  if (hasApiToken(req)) return null;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  return null;
}

// GET              -> list runs (+ which AI provider the crew uses)
// GET ?id=…        -> one run, with live status/stage while it runs
// GET ?id=…&patch=1 -> the patched HTML + applied edits for that run
export async function GET(req) {
  const denied = await gate(req); if (denied) return denied;
  const q = new URL(req.url).searchParams, id = q.get("id");
  if (q.get("stats")) return NextResponse.json(await crewStats());
  if (q.get("report")) {
    const clientId = String(q.get("report")).slice(0, 80);
    return NextResponse.json({ ...(await monthlyReport(clientId)), history: await clientRuns(clientId) });
  }
  if (!id) return NextResponse.json({ runs: await listCrewRuns(), llmConfigured: llmConfigured(), provider: provider(), model: llmConfigured() ? MODEL() : null });
  if (q.get("patch")) { const p = await getCrewPatch(id); return p ? NextResponse.json(p) : NextResponse.json({ error: "No patch for that run." }, { status: 404 }); }
  const run = await getCrewRun(id);
  return run ? NextResponse.json(run) : NextResponse.json({ error: "Run not found." }, { status: 404 });
}

// POST { input, goal, website?, ownerFacts?, clientId?, dispatch? } -> starts a run, returns { id, status }
// POST { advance: id }  -> runs that job's next stage (internal chaining / manual retry)
// POST { ..., sync: true } -> whole run in this request (local testing; needs a long limit)
export async function POST(req) {
  const denied = await gate(req); if (denied) return denied;
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  // POST { clientRun: clientId } -> start this cycle's monthly run for a client now
  if (b?.clientRun) {
    if (!llmConfigured()) return NextResponse.json({ error: "No AI provider is configured for the crew.", code: "not_configured" }, { status: 501 });
    try {
      const job = await startClientRun(String(b.clientRun).slice(0, 80));
      chainNext(req, job.id);
      return NextResponse.json({ id: job.id, status: job.status, stage: job.stage, poll: `/api/concierge/crew?id=${job.id}` }, { status: 202 });
    } catch (e) {
      return NextResponse.json({ error: e.message, code: e.code || null }, { status: e.code === "not_eligible" ? 409 : 502 });
    }
  }

  if (b?.advance) {
    const id = String(b.advance).slice(0, 40);
    const run = await getCrewRun(id);
    if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
    if (run.status === "running") chainNext(req, id);
    return NextResponse.json({ id, status: run.status, stage: run.stage });
  }

  const input = String(b?.input || "").trim(), goal = String(b?.goal || "").trim();
  if (input.length < 3 || goal.length < 5) return NextResponse.json({ error: "Send 'input' (Maps link or business name) and 'goal'." }, { status: 400 });

  // Scripted model for plumbing tests only — never in production.
  const useMock = b.mock === true && process.env.NODE_ENV !== "production";
  if (!useMock && !llmConfigured()) return NextResponse.json({ error: "No AI provider is configured for the crew (GEMINI_API_KEY, OLLAMA_API_KEY or ANTHROPIC_API_KEY).", code: "not_configured" }, { status: 501 });

  const params = {
    input: input.slice(0, 500), website: String(b.website || "").slice(0, 300), goal: goal.slice(0, 500),
    ownerFacts: String(b.ownerFacts || "").slice(0, 4000), clientId: b.clientId ? String(b.clientId).slice(0, 80) : null,
    dispatch: b.dispatch === true,
  };
  try {
    if (useMock || b.sync === true) return NextResponse.json(await runCrew({ ...params, llm: useMock ? mockLlm() : null }));
    const job = await startCrew(params);
    chainNext(req, job.id);
    return NextResponse.json({ id: job.id, status: job.status, stage: job.stage, poll: `/api/concierge/crew?id=${job.id}` }, { status: 202 });
  } catch (e) {
    console.error("[crew]", e.code || "", e.message);
    return NextResponse.json({ error: e.message || "Crew run failed.", code: e.code || null }, { status: e.code === "budget" ? 429 : 502 });
  }
}
