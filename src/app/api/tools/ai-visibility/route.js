import { NextResponse } from "next/server";
import { checkAiVisibility } from "@/lib/ai-visibility";
import { FetchBlockedError } from "@/lib/safe-fetch";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const blocked = await rateLimited(req, "ai-visibility", { limit: 15, windowSeconds: 600 });
  if (blocked) return blocked;

  let url;
  try { ({ url } = await req.json()); } catch {
    return NextResponse.json({ error: "Send a JSON body with a url field." }, { status: 400 });
  }
  if (!url || typeof url !== "string" || url.length > 2048) {
    return NextResponse.json({ error: "Provide a valid URL." }, { status: 400 });
  }
  try {
    return NextResponse.json(await checkAiVisibility(url));
  } catch (e) {
    if (e instanceof FetchBlockedError) return NextResponse.json({ error: e.message }, { status: 422 });
    return NextResponse.json({ error: e.message || "Check failed." }, { status: 502 });
  }
}
