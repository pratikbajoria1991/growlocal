import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lets the (statically cached) pages learn who is signed in without making
// every page dynamic. Returns only the email.
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ email: user?.email || null }, { headers: { "Cache-Control": "private, no-store" } });
}
