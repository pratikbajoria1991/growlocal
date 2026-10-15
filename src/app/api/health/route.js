import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { hasApiToken } from "@/lib/api-token";
import { get, set, del, storeMode } from "@/lib/store";
import { placesBatch, placesProvider } from "@/lib/places";
import { typesafeConfigured } from "@/lib/typesafe";
import { llmConfigured, provider } from "@/lib/crew/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Operator-only configuration check. Reports whether each setting is present
// and well-formed — never the values themselves.
const SECRETS = ["SESSION_SECRET", "OAUTH_TOKEN_ENCRYPTION_KEY", "OAUTH_STATE_SECRET", "CONCIERGE_API_TOKEN"];

export async function GET(req) {
  if (!hasApiToken(req)) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const env = Object.fromEntries(SECRETS.map((n) => [n, !process.env[n] ? "missing" : process.env[n].length >= 32 ? "ok" : "too short (need 32+)"]));
  env.ADMIN_EMAILS = process.env.ADMIN_EMAILS ? "ok" : "missing";
  env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ? "ok" : "missing (links fall back to default)";

  const checks = { storeMode };
  try { const k = `health:${Date.now()}`; await set(k, { ok: 1 }); checks.kvRoundTrip = (await get(k))?.ok === 1; await del(k); } catch (e) { checks.kvRoundTrip = `failed: ${String(e.message).slice(0, 80)}`; }

  checks.placesProvider = placesProvider();
  try {
    const [r] = await placesBatch([{ kind: "text", query: "dentist Kolkata", max: 1, fields: ["id"] }]);
    checks.placesLookup = r instanceof Error ? `failed: ${r.code}` : Array.isArray(r) && r.length ? "ok" : "no results";
  } catch (e) { checks.placesLookup = `failed: ${e.code || "error"}`; }

  checks.typesafe = typesafeConfigured() ? "configured" : "not configured";
  checks.crewAi = llmConfigured() ? `configured (${provider()})` : "not configured (crew disabled)";
  checks.whatsapp = process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID ? "configured" : "not configured";

  const problems = [...Object.entries(env).filter(([, v]) => v !== "ok").map(([k, v]) => `${k}: ${v}`), ...(checks.kvRoundTrip !== true ? ["KV round-trip failed"] : []), ...(checks.placesLookup !== "ok" ? ["Places lookup not working"] : [])];
  return NextResponse.json({ ok: problems.length === 0, problems, env, checks, node: process.version, region: process.env.VERCEL_REGION || null });
}
