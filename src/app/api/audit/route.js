import { NextResponse } from "next/server";
import { runAudit, runAuditOnHtml } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const { url, html } = body || {};

  // Paste-HTML path — the fallback for sites behind bot protection.
  if (html && typeof html === "string") {
    if (html.length > 5_000_000) {
      return NextResponse.json({ error: "That HTML is over 5 MB. Paste just the page source." }, { status: 413 });
    }
    try {
      return NextResponse.json(await runAuditOnHtml(html, typeof url === "string" ? url : ""));
    } catch (e) {
      return NextResponse.json({ error: e.message || "Audit failed." }, { status: 400 });
    }
  }

  // URL path
  if (!url || typeof url !== "string" || url.length > 2048) {
    return NextResponse.json({ error: "Provide a valid URL." }, { status: 400 });
  }
  try {
    return NextResponse.json(await runAudit(url));
  } catch (e) {
    return NextResponse.json(
      {
        error: e.message || "Audit failed.",
        code: e.code || null,
        // Tells the UI to surface the paste-HTML escape hatch.
        canPasteHtml: ["shielded", "timeout", "fetch_failed", "5xx"].includes(e.code),
      },
      { status: 502 }
    );
  }
}
