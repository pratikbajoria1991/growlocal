import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { listProspects, buildBrief } from "@/lib/prospects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const url = new URL(req.url).searchParams.get("url");
  const prospect = (await listProspects()).find((p) => p.url === url);
  if (!prospect) return NextResponse.json({ error: "Unknown prospect." }, { status: 404 });

  return NextResponse.json({ brief: buildBrief(prospect) });
}
