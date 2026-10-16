import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { clientsForOwner, upsertClient } from "@/lib/clients";
import { rateLimited } from "@/lib/rate-limit";
import { normalizeOnboarding, onboardingProgress } from "@/lib/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The owner saves their onboarding form. Ownership is checked against the
// client record; the form is sanitised server-side, never trusted as sent.
// POST { clientId, data, consent: { posting, data } }
export async function POST(req) {
  const blocked = await rateLimited(req, "owner-onboarding", { limit: 30, windowSeconds: 600 });
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const client = (await clientsForOwner(user.email)).find((c) => c.id === b?.clientId);
  if (!client) return NextResponse.json({ error: "Not your business." }, { status: 403 });

  const onboarding = { ...normalizeOnboarding(b.data), updatedAt: new Date().toISOString() };

  // Consent keeps its original timestamp while it stays given; unticking withdraws it.
  const prev = client.consent || {};
  const stamp = (on, was) => (on ? (was?.at ? was : { at: new Date().toISOString(), by: user.email }) : null);
  const consent = { posting: stamp(!!b.consent?.posting, prev.posting), data: stamp(!!b.consent?.data, prev.data) };

  const patch = { id: client.id, onboarding, consent };
  // The form's goal starts monthly runs only when the team hasn't set one.
  if (!client.crewGoal && onboarding.goal.length >= 5) patch.crewGoal = onboarding.goal;

  const updated = await upsertClient(patch);
  return NextResponse.json({ ok: true, progress: onboardingProgress(updated.onboarding, updated.consent) });
}
