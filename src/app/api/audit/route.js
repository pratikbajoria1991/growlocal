import { NextResponse } from "next/server";
import { runAudit, runAuditOnHtml, runAuditOnText } from "@/lib/audit";
import { runGbpAudit } from "@/lib/gbp-audit";
import { rateLimited } from "@/lib/rate-limit";

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

  const { url, html, text, mode, link } = body || {};

  // GBP profile mode — resolves and scores the live Google Business Profile.
  // Stricter bucket: once GOOGLE_PLACES_API_KEY is set this calls a paid API
  // per request, so it gets a tighter quota than the free website audit.
  if (mode === "gbp") {
    const blocked = await rateLimited(req, "audit-gbp", { limit: 5, windowSeconds: 600 });
    if (blocked) return blocked;

    if (!link || typeof link !== "string" || link.length > 2048) {
      return NextResponse.json({ error: "Paste a Google Maps or Business Profile link." }, { status: 400 });
    }
    try {
      return NextResponse.json(await runGbpAudit(link));
    } catch (e) {
      return NextResponse.json(
        { error: e.message || "GBP audit failed.", code: e.code || null },
        { status: e.code === "not_configured" ? 501 : 400 }
      );
    }
  }

  // URL / HTML / Text modes share one quota — same cost profile (a fetch,
  // or CPU-bound parsing of a payload the caller controls the size of).
  const blocked = await rateLimited(req, "audit", { limit: 10, windowSeconds: 600 });
  if (blocked) return blocked;

  // Plain-text mode — content structure only, scored honestly.
  if (mode === "text" || (text && !html && !url)) {
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Paste some content first." }, { status: 400 });
    }
    if (text.length > 2_000_000) {
      return NextResponse.json({ error: "That's over 2 MB of text. Trim it down." }, { status: 413 });
    }
    try {
      return NextResponse.json(await runAuditOnText(text));
    } catch (e) {
      return NextResponse.json({ error: e.message || "Audit failed." }, { status: 400 });
    }
  }

  // Pasted-HTML mode — full three-surface audit, no fetch needed.
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

  // URL mode.
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
        canPasteHtml: ["shielded", "timeout", "fetch_failed", "5xx"].includes(e.code),
      },
      // Bad input (blocked address, unknown domain, 404) is the caller's to fix, not an upstream failure.
      { status: ["blocked", "dns", "404", "not_html"].includes(e.code) ? 422 : 502 }
    );
  }
}
