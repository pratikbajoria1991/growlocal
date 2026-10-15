import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { rateLimited } from "@/lib/rate-limit";
import { buildProposal, saveProposal, listProposals } from "@/lib/proposal";
import { hasApiToken } from "@/lib/api-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  const user = await getCurrentUser();
  const admin = isAdmin(user) || hasApiToken(req);

  // Each proposal costs several paid Maps lookups plus a website fetch, so the
  // public form is tightly limited. Admins generating outbound aren't.
  if (!admin) {
    const blocked = await rateLimited(req, "proposal", { limit: 3, windowSeconds: 3600 });
    if (blocked) return blocked;
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = String(body?.input || "").trim();
  const website = String(body?.website || "").trim();
  if (input.length < 3) {
    return NextResponse.json({ error: "Paste your Google Maps link, or type your business name and area." }, { status: 400 });
  }

  try {
    const proposal = await buildProposal({ input: input.slice(0, 500), website: website.slice(0, 300) });
    await saveProposal(proposal);
    return NextResponse.json({ id: proposal.id, url: `/p/${proposal.id}`, counts: proposal.counts, tier: proposal.tier.name });
  } catch (e) {
    const status = e.code === "not_configured" ? 501 : e.code === "not_found" || e.code === "closed" || e.code === "unparseable" || e.code === "bad_url" ? 400 : 502;
    if (status === 502) console.error("[proposal]", e.code, e.message);
    return NextResponse.json({ error: e.message || "Couldn't build the proposal. Try again shortly." }, { status });
  }
}

export async function GET(req) {
  if (!hasApiToken(req)) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  return NextResponse.json({ proposals: await listProposals() });
}
