import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req) {
  await clearSession();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}

export const GET = POST;
