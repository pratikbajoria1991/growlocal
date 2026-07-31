import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let url;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a url field." }, { status: 400 });
  }
  if (!url || typeof url !== "string" || url.length > 2048) {
    return NextResponse.json({ error: "Provide a valid URL." }, { status: 400 });
  }
  try {
    return NextResponse.json(await runAudit(url));
  } catch (e) {
    return NextResponse.json({ error: e.message || "Audit failed." }, { status: 502 });
  }
}
