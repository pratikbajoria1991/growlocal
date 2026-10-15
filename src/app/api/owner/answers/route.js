import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { clientsForOwner, upsertClient } from "@/lib/clients";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The owner answers questions the Growth Crew couldn't answer from verified
// data (hours, doctors, services). Answers become owner-supplied facts for
// the next run. Ownership is checked against the client record.
export async function POST(req) {
  const blocked = await rateLimited(req, "owner-answers", { limit: 20, windowSeconds: 600 });
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const client = (await clientsForOwner(user.email)).find((c) => c.id === b?.clientId);
  if (!client) return NextResponse.json({ error: "Not your business." }, { status: 403 });

  const answers = (Array.isArray(b.answers) ? b.answers : [])
    .map((x) => ({ q: String(x?.q || "").trim().slice(0, 300), a: String(x?.a || "").trim().slice(0, 1000) }))
    .filter((x) => x.q && x.a)
    .slice(0, 20);
  if (!answers.length) return NextResponse.json({ error: "Write at least one answer." }, { status: 400 });

  const at = new Date().toISOString();
  const lines = answers.map((x) => `${x.q}: ${x.a}`).join("\n");
  const ownerFacts = [client.ownerFacts, `[Owner answered ${at.slice(0, 10)}]\n${lines}`].filter(Boolean).join("\n\n").slice(-4000);
  const updated = await upsertClient({ id: client.id, ownerFacts, ownerAnswers: [...(client.ownerAnswers || []), ...answers.map((x) => ({ ...x, at }))] });
  return NextResponse.json({ ok: true, answered: answers.length, total: updated.ownerAnswers.length });
}
